"use client";

import { ChevronLeft, Search, User, UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

// Types matching API response
interface SearchUser {
	id: string;
	name: string;
	image: string | null;
	currentStreak: number;
	friendshipStatus: "none" | "pending" | "accepted";
	isSender: boolean;
}

export default function FriendSearchPage() {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchUser[]>([]);
	const [history, setHistory] = useState<SearchUser[]>([]); // Stored in local storage
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

	const handleFollow = async (user: SearchUser) => {
		// Optimistic update
		const originalStatus = user.friendshipStatus;
		const originalIsSender = user.isSender;

		const updateList = (list: SearchUser[]) =>
			list.map((u) => {
				if (u.id === user.id) {
					return { ...u, friendshipStatus: "pending" as const, isSender: true };
				}
				return u;
			});

		setResults(updateList(results));
		setHistory(updateList(history));

		// Add to history when interacting
		addToHistory(user);

		try {
			const res = await apiClient.api.users[":id"]["friend-request"].$post({
				param: { id: user.id },
			});
			if (!res.ok) {
				throw new Error("Failed to follow");
			}
			// Success
		} catch (_) {
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
			setHistory(revertList(history));
			alert("フォローに失敗しました");
		}
	};

	// Render User Card
	const UserCard = ({ user }: { user: SearchUser }) => {
		// Random gradient or deterministic based on ID
		// Simple approach: alternating colors based on ID char code sum?
		// For now, using the style from image (Gradient)
		// Image shows variety: Red/Purple, Green/Yellow/Blue, Blue/Cyan, etc.
		// Let's just pick one cycle based on ID
		const gradients = [
			"bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500", // Red/Purple
			"bg-gradient-to-r from-yellow-400 via-green-400 to-teal-400", // Yellow/Green
			"bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400", // Blue/Cyan
			"bg-gradient-to-r from-red-400 to-orange-400", // Red/Orange
		];
		const gradientIndex = user.id.charCodeAt(0) % gradients.length;
		const gradientClass = gradients[gradientIndex];

		return (
			<div
				className={`rounded-full p-1 pl-2 pr-2 mb-3 shadow-sm text-white ${gradientClass}`}
			>
				<div className="flex items-center justify-between bg-white/10 rounded-full p-2 h-20">
					{/* Left: Avatar + Info */}
					<div className="flex items-center gap-3 flex-1 overflow-hidden">
						{/* Avatar */}
						<div className="h-12 w-12 rounded-full bg-slate-300 border-2 border-white/50 shrink-0 overflow-hidden">
							{user.image ? (
								// biome-ignore lint/performance/noImgElement: dynamic content
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={user.image}
									alt={user.name}
									className="h-full w-full object-cover"
								/>
							) : (
								<User className="h-full w-full p-2 text-white/50" />
							)}
						</div>
						{/* Text */}
						<div className="flex flex-col min-w-0">
							<div className="flex items-baseline gap-2">
								<span className="font-bold text-base truncate shadow-black drop-shadow-sm">
									{user.name}
								</span>
								<span className="text-[10px] opacity-80 truncate hidden sm:inline">
									({user.id.slice(0, 8)}...)
								</span>
							</div>
							{/* Mobile ID: simplified */}
							<span className="text-[10px] opacity-80 truncate sm:hidden block">
								(ID: {user.id.slice(0, 6)}...)
							</span>
							<div className="text-xs font-medium opacity-90 mt-0.5">
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
							<div className="bg-gray-400/80 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
								{user.isSender ? "申請中" : "承認待ち"}
							</div>
						) : (
							<div className="bg-green-500/80 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
								<UserCheck className="w-3 h-3" /> 友達
							</div>
						)}
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className="fixed inset-0 z-50 bg-[#F2F2F7] overflow-y-auto font-sans text-slate-900">
			{/* Header */}
			<div className="sticky top-0 z-50 bg-[#F2F2F7] pt-2 pb-2 px-4 shadow-sm">
				{/* Status Bar filler handled by padding usually, but for fixed overlay just top padding */}
				<div className="h-4" />
				<div className="relative flex items-center justify-center p-2 mb-2">
					<button
						type="button"
						onClick={() => router.push("/")}
						className="absolute left-0 p-2 text-gray-500"
					>
						<ChevronLeft className="h-6 w-6" />
					</button>
					<h1 className="text-lg font-bold text-gray-700">検索</h1>
				</div>

				{/* Search Bar */}
				<div className="relative">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="ユーザ名またはユーザーIDを入力"
						className="w-full bg-white rounded-full py-2.5 pl-4 pr-10 text-sm shadow-sm border-none outline-none focus:ring-2 focus:ring-blue-400/50"
					/>
					<Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
				</div>
			</div>

			{/* Body */}
			<div className="p-4 pt-2">
				{!isSearching && history.length > 0 && query.length === 0 ? (
					<>
						<h2 className="text-xs font-bold text-gray-500 mb-3 ml-1">
							検索履歴一覧
						</h2>
						{history.map((user) => (
							<UserCard key={`history-${user.id}`} user={user} />
						))}
					</>
				) : (
					// Search Results
					<>
						{query.length > 0 && (
							<h2 className="text-xs font-bold text-gray-500 mb-3 ml-1">
								{isLoading ? "検索中..." : "検索結果"}
							</h2>
						)}
						{results.map((user) => (
							<UserCard key={user.id} user={user} />
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
