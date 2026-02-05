"use client";

import { ChevronLeft, Search, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface Friend {
	id: string;
	name: string;
	username: string | null;
	image: string | null;
	currentStreak: number;
	role: "follower" | "following";
}

export default function FriendsPage() {
	const searchParams = useSearchParams();
	const initialTab =
		searchParams.get("tab") === "following" ? "following" : "followers";

	const [friends, setFriends] = useState<Friend[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<"followers" | "following">(
		initialTab,
	);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const fetchFriends = async () => {
			try {
				const res = await apiClient.api.users.me.friends.$get();
				if (res.ok) {
					const data = await res.json();
					setFriends(data.friends as Friend[]);
				}
			} catch (error) {
				console.error("Failed to fetch friends", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchFriends();
	}, []);

	const filteredFriends = useMemo(() => {
		return friends.filter((f) => {
			const matchesTab =
				activeTab === "followers"
					? f.role === "follower"
					: f.role === "following";
			const matchesSearch =
				f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(f.username || "").toLowerCase().includes(searchQuery.toLowerCase());
			return matchesTab && matchesSearch;
		});
	}, [friends, activeTab, searchQuery]);

	const followersCount = friends.filter((f) => f.role === "follower").length;
	const followingCount = friends.filter((f) => f.role === "following").length;

	const handleAction = async (
		friendId: string,
		role: "follower" | "following",
	) => {
		try {
			// type パラメータを追加してフォロー解除かフォロワー削除かを区別
			const res = await apiClient.api.users[":id"].friend.$delete({
				param: { id: friendId },
				query: { type: role === "follower" ? "follower" : "following" },
			});
			if (res.ok) {
				setFriends((prev) =>
					prev.filter((f) => !(f.id === friendId && f.role === role)),
				);
			}
		} catch (error) {
			console.error("Failed to perform action", error);
		}
	};

	return (
		<div className="min-h-screen pb-24 font-sans">
			{/* Header */}
			<header className="flex items-center px-4 py-6">
				<Link href="/profile" className="text-gray-400">
					<ChevronLeft className="w-6 h-6" />
				</Link>
				<h1 className="flex-1 text-center font-bold text-gray-500 text-lg mr-6">
					@{friends[0]?.username || "not_me"}
				</h1>
			</header>

			{/* Tabs */}
			<div className="flex px-8 mb-6 border-b border-gray-100">
				<button
					type="button"
					onClick={() => setActiveTab("followers")}
					className={`flex-1 pb-3 text-sm font-bold transition-all ${
						activeTab === "followers"
							? "text-black border-b-2 border-black"
							: "text-gray-400"
					}`}
				>
					{followersCount > 0 ? `${followersCount} ` : ""}フォロワー
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("following")}
					className={`flex-1 pb-3 text-sm font-bold transition-all ${
						activeTab === "following"
							? "text-black border-b-2 border-black"
							: "text-gray-400"
					}`}
				>
					{followingCount > 0 ? `${followingCount} ` : ""}フォロー中
				</button>
			</div>

			{/* Search Bar */}
			<div className="px-6 mb-6">
				<div className="relative">
					<input
						type="text"
						placeholder="ユーザ名またはユーザーIDを入力"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full h-11 bg-white border border-gray-200 rounded-full pl-6 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-sky-200"
					/>
					<Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
				</div>
			</div>

			{/* List Content */}
			<div className="px-6 space-y-3">
				{isLoading ? (
					<div className="text-center py-10 text-gray-400 text-sm">
						読み込み中...
					</div>
				) : filteredFriends.length === 0 ? (
					<div className="text-center py-10 text-gray-400 text-sm">
						{searchQuery ? "見つかりませんでした" : "リストは空です"}
					</div>
				) : (
					filteredFriends.map((friend) => (
						<div
							key={`${friend.id}-${friend.role}`}
							className="bg-white rounded-[32px] p-4 flex items-center gap-3 shadow-sm"
						>
							<div className="w-14 h-14 rounded-full bg-[#99B2D9] overflow-hidden flex-shrink-0 relative">
								{friend.image ? (
									<Image
										src={friend.image}
										alt={friend.name}
										fill
										className="object-cover"
										unoptimized
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<User className="w-7 h-7 text-white" />
									</div>
								)}
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-bold text-gray-800 truncate">
									{friend.name}{" "}
									<span className="text-gray-400 text-xs font-normal">
										（{friend.username || "id:" + friend.id.slice(0, 4)}）
									</span>
								</h3>
								<p className="text-xs text-gray-500 font-bold">
									連続日数：{friend.currentStreak}日
								</p>
							</div>
							<button
								type="button"
								onClick={() => handleAction(friend.id, friend.role)}
								className="bg-gray-400 text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
							>
								{friend.role === "follower" ? "削除" : "フォロー中"}
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
}
