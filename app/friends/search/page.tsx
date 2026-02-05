"use client";

import { Check, Search, User, UserCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Top } from "@/components/top";
import { apiClient } from "@/lib/api-client";

const pageName = "検索";

// Types matching API response
interface SearchUser {
	id: string;
	name: string;
	username: string | null;
	image: string | null;
	currentStreak: number;
	friendshipStatus: "none" | "pending" | "accepted";
	isSender: boolean;
}

interface FriendRequest {
	id: string; // Request ID
	user: {
		id: string;
		name: string;
		image: string | null;
		// stored other fields if needed
	};
}

export default function FriendSearchPage() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchUser[]>([]);
	const [history, setHistory] = useState<SearchUser[]>([]); // Stored in local storage
	const [requests, setRequests] = useState<FriendRequest[]>([]); // Incoming requests
	const [isSearching, setIsSearching] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Load history on mount
	useEffect(() => {
		const saved = localStorage.getItem("friend_search_history");
		if (saved) {
			try {
				setHistory(JSON.parse(saved));
			} catch (e) {
				console.error("Failed to parse history", e);
			}
		}
	}, []);

	// Fetch friend requests on mount
	useEffect(() => {
		const fetchRequests = async () => {
			try {
				const res = await apiClient.api.users.me["friend-requests"].$get();
				if (res.ok) {
					const json = await res.json();
					// The API returns { requests: { id, user: {...} }[] }
					// We need to map it correctly if needed, but the structure seems to match FriendRequest interface largely
					// Assuming the API returns user object inside request
					setRequests(json.requests as unknown as FriendRequest[]);
				}
			} catch (error) {
				console.error("Failed to fetch requests", error);
			}
		};
		fetchRequests();
	}, []);

	// Save history helper
	const addToHistory = (user: SearchUser) => {
		const newHistory = [user, ...history.filter((h) => h.id !== user.id)].slice(
			0,
			10,
		); // Keep last 10
		setHistory(newHistory);
		localStorage.setItem("friend_search_history", JSON.stringify(newHistory));
	};

	// Search API
	useEffect(() => {
		const timer = setTimeout(async () => {
			if (!query.trim()) {
				setResults([]);
				setIsSearching(false);
				return;
			}

			setIsSearching(true);
			setIsLoading(true);

			try {
				const res = await apiClient.api.users.search.$get({
					query: { q: query },
				});
				if (res.ok) {
					const json = await res.json();
					if ("users" in json) {
						setResults(json.users as unknown as SearchUser[]);
					}
				}
			} catch (error) {
				console.error("Search error", error);
			} finally {
				setIsLoading(false);
			}
		}, 500); // 500ms debounce

		return () => clearTimeout(timer);
	}, [query]);

	// Sync history with search results
	useEffect(() => {
		if (results.length === 0) return;

		let hasChanges = false;
		const newHistory = history.map((hUser) => {
			const matchingResult = results.find((r) => r.id === hUser.id);
			if (matchingResult) {
				if (
					matchingResult.friendshipStatus !== hUser.friendshipStatus ||
					matchingResult.isSender !== hUser.isSender
				) {
					hasChanges = true;
					return matchingResult;
				}
			}
			return hUser;
		});

		if (hasChanges) {
			setHistory(newHistory);
			localStorage.setItem("friend_search_history", JSON.stringify(newHistory));
		}
	}, [results, history]);

	const handleFollow = async (user: SearchUser) => {
		// Determine action: Request, Cancel, or Unfriend
		const isCancelling = user.friendshipStatus === "pending" && user.isSender;
		const isUnfriending = user.friendshipStatus === "accepted";

		if (user.friendshipStatus !== "none" && !isCancelling && !isUnfriending) {
			return; // Incoming pending requests cannot be handled here yet
		}

		// Optimistic update
		const originalStatus = user.friendshipStatus;
		const originalIsSender = user.isSender;

		// Logic:
		// None -> Pending (Send Request)
		// Pending -> None (Cancel Request)
		// Accepted -> None (Unfriend)
		let targetStatus: "none" | "pending" | "accepted" = "pending";
		let targetIsSender = true;

		if (isCancelling || isUnfriending) {
			targetStatus = "none";
			targetIsSender = false;
		} else {
			// Sending request
			targetStatus = "pending";
			targetIsSender = true;
		}

		const updatedUser = {
			...user,
			friendshipStatus: targetStatus,
			isSender: targetIsSender,
		};

		const updateList = (list: SearchUser[]) =>
			list.map((u) => {
				if (u.id === user.id) {
					return updatedUser;
				}
				return u;
			});

		setResults(updateList(results));

		// Add to history when interacting - use updatedUser!
		addToHistory(updatedUser);

		try {
			if (isCancelling) {
				const res = await apiClient.api.users[":id"]["friend-request"].$delete({
					param: { id: user.id },
				});
				if (!res.ok) throw new Error("Failed to cancel");
			} else if (isUnfriending) {
				const res = await apiClient.api.users[":id"].friend.$delete({
					param: { id: user.id },
					query: { type: "following" },
				});
				if (!res.ok) throw new Error("Failed to unfriend");
			} else {
				const res = await apiClient.api.users[":id"]["friend-request"].$post({
					param: { id: user.id },
				});
				if (!res.ok) throw new Error("Failed to follow");
			}
		} catch {
			// Revert
			const revertList = (list: SearchUser[]) =>
				list.map((u) => {
					if (u.id === user.id) {
						return {
							...u,
							friendshipStatus: originalStatus,
							isSender: originalIsSender,
						};
					}
					return u;
				});
			setResults(revertList(results));
			// Sync history revert
			setHistory(revertList(history));

			const currentHistory = JSON.parse(
				localStorage.getItem("friend_search_history") || "[]",
			);
			const revertedHistory = revertList(currentHistory);
			localStorage.setItem(
				"friend_search_history",
				JSON.stringify(revertedHistory),
			);

			if (isUnfriending) {
				alert("削除に失敗しました");
			} else if (isCancelling) {
				alert("キャンセルに失敗しました");
			} else {
				alert("フォローに失敗しました");
			}
		}
	};

	const handleAccept = async (requestId: string) => {
		// Optimistic remove
		const prevRequests = [...requests];
		setRequests(requests.filter((r) => r.id !== requestId));

		try {
			const res = await apiClient.api.users["friend-request"][
				":requestId"
			].accept.$post({
				param: { requestId },
			});
			if (!res.ok) throw new Error("Failed to accept");
			// Refresh results if showing to update status?
			// Ideally we would update status of user in results/history if present
			// but for now simplest is just accept.
		} catch (e) {
			console.error("Accept failed", e);
			setRequests(prevRequests);
			alert("承認に失敗しました");
		}
	};

	const handleDecline = async (requestId: string) => {
		// Optimistic remove
		const prevRequests = [...requests];
		setRequests(requests.filter((r) => r.id !== requestId));

		try {
			const res = await apiClient.api.users["friend-request"][
				":requestId"
			].$delete({
				param: { requestId },
			});
			if (!res.ok) throw new Error("Failed to decline");
		} catch (e) {
			console.error("Decline failed", e);
			setRequests(prevRequests);
			alert("拒否に失敗しました");
		}
	};

	// Render User Card
	const UserCard = ({ user, index }: { user: SearchUser; index: number }) => {
		const patterns = [
			"from-[#FF005C]", // Red/Pink
			"from-[#E2FF00]", // Yellow/Green
			"from-[#00CCFF]", // Blue/Cyan
		];
		const pattern = patterns[index % patterns.length];

		return (
			<div
				className={`rounded-full p-1 pl-2 pr-2 mb-3 shadow-sm text-slate-900 bg-gradient-to-r ${pattern} via-white via-70% to-white`}
			>
				<div className="flex items-center justify-between bg-white/20 rounded-full p-2 h-20">
					{/* Left: Avatar + Info */}
					<div className="flex items-center gap-3 flex-1 overflow-hidden">
						{/* Avatar */}
						<div className="h-12 w-12 rounded-full bg-slate-300 border-2 border-white/50 shrink-0 overflow-hidden">
							{user.image ? (
								<>
									{/* eslint-disable @next/next/no-img-element */}
									{/* biome-ignore lint/performance/noImgElement: dynamic content */}
									<img
										src={user.image}
										alt={user.name}
										className="h-full w-full object-cover"
									/>
									{/* eslint-enable @next/next/no-img-element */}
								</>
							) : (
								<User className="h-full w-full p-2 text-slate-400" />
							)}
						</div>
						{/* Text */}
						<div className="flex flex-col min-w-0">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-base truncate">
									{user.name}
								</span>
								{user.username && (
									<span className="text-[10px] text-slate-500 truncate">
										ID: {user.username}
									</span>
								)}
							</div>
							<div className="text-xs font-medium text-slate-500 mt-0.5">
								連続日数 : {user.currentStreak}日
							</div>
						</div>
					</div>

					{/* Right: Button */}
					<div className="shrink-0 ml-2">
						{user.friendshipStatus === "none" ? (
							<button
								type="button"
								onClick={() => handleFollow(user)}
								className="bg-[#007AFF] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md active:opacity-80 transition-opacity"
							>
								フォロー
							</button>
						) : user.friendshipStatus === "pending" ? (
							user.isSender ? (
								<button
									type="button"
									onClick={() => handleFollow(user)}
									className="bg-gray-400/80 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 active:opacity-80 transition-opacity"
								>
									申請中
								</button>
							) : (
								<div className="bg-gray-400/80 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
									承認待ち
								</div>
							)
						) : (
							<button
								type="button"
								onClick={() => handleFollow(user)}
								className="bg-green-500/80 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 active:opacity-80 transition-opacity"
							>
								<UserCheck className="w-3 h-3" /> 友達
							</button>
						)}
					</div>
				</div>
			</div>
		);
	};

	// Render Request Card
	const RequestCard = ({ req }: { req: FriendRequest }) => {
		const user = req.user;
		return (
			<div className="rounded-full p-1 pl-2 pr-2 mb-3 shadow-sm text-slate-900 bg-gradient-to-r from-orange-400 via-white via-70% to-white">
				<div className="flex items-center justify-between bg-white/20 rounded-full p-2 h-20">
					{/* Left: Avatar + Info */}
					<div className="flex items-center gap-3 flex-1 overflow-hidden">
						{/* Avatar */}
						<div className="h-12 w-12 rounded-full bg-slate-300 border-2 border-white/50 shrink-0 overflow-hidden">
							{user.image ? (
								<>
									{/* eslint-disable @next/next/no-img-element */}
									{/* biome-ignore lint/performance/noImgElement: dynamic content */}
									<img
										src={user.image}
										alt={user.name}
										className="h-full w-full object-cover"
									/>
									{/* eslint-enable @next/next/no-img-element */}
								</>
							) : (
								<User className="h-full w-full p-2 text-slate-400" />
							)}
						</div>
						{/* Text */}
						<div className="flex flex-col min-w-0">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-base truncate">
									{user.name}
								</span>
							</div>
							<div className="text-xs font-medium text-slate-500 mt-0.5">
								友達申請が届いています
							</div>
						</div>
					</div>

					{/* Right: Buttons */}
					<div className="shrink-0 ml-2 flex gap-2">
						<button
							type="button"
							onClick={() => handleDecline(req.id)}
							className="text-slate-400 p-2 rounded-full hover:bg-slate-100 transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
						<button
							type="button"
							onClick={() => handleAccept(req.id)}
							className="bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md active:opacity-80 transition-opacity flex items-center gap-1"
						>
							<Check className="w-4 h-4" /> 承認
						</button>
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto font-sans text-slate-900 bg-white">
			{/* Header */}
			<div className="sticky top-0 z-50 pt-2 pb-2 px-4 shadow-sm bg-white">
				<Top name={pageName} />

				{/* Search Bar */}
				<div className="relative">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="ユーザー名または表示名を入力"
						className="w-full bg-white rounded-full py-2.5 pl-4 pr-10 text-sm shadow-sm border border-slate-200 outline-none focus:ring-2 focus:ring-blue-400/50"
					/>
					<Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
				</div>
			</div>

			{/* Body */}
			<div className="p-4 pt-2">
				{!isSearching && query.length === 0 ? (
					<>
						{/* Requests List */}
						{requests.length > 0 && (
							<div className="mb-6">
								<h2 className="text-xs font-bold text-gray-500 mb-3 ml-1">
									友達リクエスト ({requests.length})
								</h2>
								{requests.map((req) => (
									<RequestCard key={req.id} req={req} />
								))}
							</div>
						)}

						{/* History */}
						{history.length > 0 && (
							<>
								<h2 className="text-xs font-bold text-gray-500 mb-3 ml-1">
									検索履歴一覧
								</h2>
								{history.map((user, i) => (
									<UserCard key={`history-${user.id}`} user={user} index={i} />
								))}
							</>
						)}
					</>
				) : (
					// Search Results
					<>
						{query.length > 0 && (
							<h2 className="text-xs font-bold text-gray-500 mb-3 ml-1">
								{isLoading ? "検索中..." : "検索結果"}
							</h2>
						)}
						{results.map((user, i) => (
							<UserCard key={user.id} user={user} index={i} />
						))}
						{!isLoading && query.length > 0 && results.length === 0 && (
							<p className="text-center text-gray-400 text-sm mt-10">
								見つかりませんでした
							</p>
						)}
					</>
				)}
			</div>
		</div>
	);
}
