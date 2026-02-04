"use client";

import { ChevronLeft, Search, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"follower" | "following">(
		"follower",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [friends, setFriends] = useState<Friend[]>([]);
	const [myUsername, setMyUsername] = useState<string>("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [friendsRes, profileRes] = await Promise.all([
					apiClient.api.users.me.friends.$get(),
					apiClient.api.users.me.profile.$get(),
				]);

				if (friendsRes.ok) {
					const data = await friendsRes.json();
					setFriends(data.friends as Friend[]);
				}

				if (profileRes.ok) {
					const data = await profileRes.json();
					setMyUsername(data.user.username || "me");
				}
			} catch (error) {
				console.error("Failed to fetch data", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	const handleDeleteFriend = async (friendId: string) => {
		if (!confirm("友達から削除しますか？")) return;
		try {
			const res = await apiClient.api.users[":id"].friend.$delete({
				param: { id: friendId },
			});
			if (res.ok) {
				setFriends((prev) => prev.filter((f) => f.id !== friendId));
			}
		} catch (error) {
			console.error("Failed to delete friend", error);
		}
	};

	const filteredFriends = friends.filter((f) => {
		if (f.role !== activeTab) return false;
		if (!searchQuery) return true;
		return (
			f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			f.username?.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	const followerCount = friends.filter((f) => f.role === "follower").length;
	const followingCount = friends.filter((f) => f.role === "following").length;

	return (
		<div className="bg-[#F2F2F7] min-h-screen pb-24 font-sans text-slate-900">
			{/* Header */}
			<header className="flex items-center justify-between px-4 pt-12 pb-4 bg-[#F2F2F7] sticky top-0 z-20">
				<button
					type="button"
					onClick={() => router.back()}
					className="p-2 -ml-2 text-gray-500"
				>
					<ChevronLeft className="w-6 h-6" />
				</button>
				<h1 className="text-xl font-bold text-gray-700">@{myUsername}</h1>
				<div className="w-10" />
			</header>

			{/* Tabs */}
			<div className="flex px-8 border-b border-gray-200 bg-[#F2F2F7]">
				<button
					type="button"
					onClick={() => setActiveTab("follower")}
					className={`flex-1 py-3 text-sm font-bold transition-all relative ${
						activeTab === "follower" ? "text-gray-900" : "text-gray-400"
					}`}
				>
					{followerCount} フォロワー
					{activeTab === "follower" && (
						<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-800 rounded-full" />
					)}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("following")}
					className={`flex-1 py-3 text-sm font-bold transition-all relative ${
						activeTab === "following" ? "text-gray-900" : "text-gray-400"
					}`}
				>
					{followingCount} フォロー中
					{activeTab === "following" && (
						<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-800 rounded-full" />
					)}
				</button>
			</div>

			{/* Search Bar */}
			<div className="px-6 py-4">
				<div className="relative flex items-center gap-3">
					<div className="relative flex-1">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="ユーザ名またはユーザーIDを入力"
							className="w-full bg-white rounded-full py-2.5 px-6 text-sm shadow-sm border-none outline-none focus:ring-2 focus:ring-blue-400/50 pr-10"
						/>
						<Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
					</div>
					<button type="button" className="text-gray-400">
						<Search className="h-6 w-6" />
					</button>
				</div>
			</div>

			{/* List */}
			<div className="px-6 space-y-3">
				{isLoading ? (
					<div className="text-center py-12 text-gray-400 font-medium">
						読み込み中...
					</div>
				) : filteredFriends.length === 0 ? (
					<div className="text-center py-12 text-gray-400 font-medium text-sm">
						{searchQuery ? "見つかりませんでした" : "まだ誰もいません"}
					</div>
				) : (
					filteredFriends.map((friend) => (
						<div
							key={friend.id}
							className="bg-white rounded-[24px] p-4 flex items-center justify-between shadow-sm border border-gray-100/50"
						>
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden relative border-2 border-white shadow-sm shrink-0">
									{friend.image ? (
										<Image
											src={friend.image}
											alt={friend.name}
											fill
											className="object-cover"
											unoptimized
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center bg-slate-300">
											<User className="w-6 h-6 text-white/50" />
										</div>
									)}
								</div>
								<div className="min-w-0">
									<div className="flex items-center gap-1 flex-wrap">
										<h3 className="font-bold text-gray-900 truncate">
											{friend.name}
										</h3>
										<span className="text-[10px] text-gray-400 font-medium truncate">
											（{friend.username || "ユーザーIDなし"}）
										</span>
									</div>
									<p className="text-[11px] text-gray-500 font-bold mt-0.5">
										連続日数 : {friend.currentStreak}日
									</p>
								</div>
							</div>

							<button
								type="button"
								onClick={() => handleDeleteFriend(friend.id)}
								className="bg-[#9E9E9E] text-white text-[10px] font-bold px-5 py-1.5 rounded-lg active:scale-95 transition-transform"
							>
								{activeTab === "follower" ? "削除" : "フォロー中"}
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
}
