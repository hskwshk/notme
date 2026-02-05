"use client";

import { Clock, Edit, Flame, Trophy, User as UserIcon, X } from "lucide-react"; // Import icons
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { UserGraph } from "@/components/home/user-graph";
import { apiClient } from "@/lib/api-client";

// Types matching API response
interface ProfileData {
	user: {
		id: string;
		name: string;
		username: string | null;
		image: string | null;
		characterName: string | null;
		level: number;
		currentStreak: number;
		maxStreak: number;
		totalDuration: number;
		maxMinutes: number;
	};
	stats: {
		followingCount: number;
		followerCount: number;
		requestCount: number;
		totalStampCount: number;
		monthMaxMinutes: number;
	};
	graph: {
		label: string;
		minutes: number;
	}[];
	favoriteStamps: {
		id: string;
		name: string;
		imageUrl: string;
		favoriteOrder: number | null;
	}[];
}

export default function ProfilePage() {
	const [showGraphHelp, setShowGraphHelp] = useState(false);
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const res = await apiClient.api.users.me.profile.$get();
				if (res.ok) {
					const data = await res.json();
					setProfile(data);
				}
			} catch (error) {
				console.error("Failed to fetch profile", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchProfile();
	}, []);

	if (isLoading) {
		return <div className="p-8 text-center">Loading...</div>;
	}

	if (!profile) {
		return <div className="p-8 text-center">Failed to load profile</div>;
	}

	return (
		<div className="bg-white min-h-screen pb-24 relative font-sans">
			{showGraphHelp && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop
				// biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop
				<div
					className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
					onClick={() => setShowGraphHelp(false)}
				>
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content */}
					<div
						className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in duration-300"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-between items-start mb-4">
							<div className="bg-[#99D9F8]/20 p-2 rounded-2xl">
								<Clock className="w-6 h-6 text-[#78C8E8]" />
							</div>
							<button
								type="button"
								onClick={() => setShowGraphHelp(false)}
								className="text-gray-300 hover:text-gray-500 transition-colors"
							>
								<X className="w-6 h-6" />
							</button>
						</div>

						<h3 className="text-xl font-black text-gray-800 mb-3">
							グラフの読み方
						</h3>
						<div className="space-y-4 text-sm text-gray-600 leading-relaxed">
							<p>このグラフは、直近の運動時間を視覚化したものです。</p>
							<div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
								<p className="font-bold text-gray-800 mb-1">
									縦軸（max）について
								</p>
								<p>
									過去30日間で**最も運動した日の記録**を
									100%として表示しています。
								</p>
							</div>
							<p>
								自己ベストを更新すると、グラフの基準（max）も自動的に引き上げられます。
							</p>
						</div>

						<button
							type="button"
							className="mt-8 w-full bg-[#99D9F8] hover:bg-[#88C8E8] text-white font-black py-4 rounded-2xl shadow-lg shadow-sky-200 transition-all active:scale-[0.98]"
							onClick={() => setShowGraphHelp(false)}
						>
							わかった！
						</button>
					</div>
				</div>
			)}

			<div className="max-w-md mx-auto px-4">
				{/* Header */}
				<header className="flex items-center justify-between py-6">
					<div className="w-10" />
					<h1 className="text-2xl font-bold text-gray-500 tracking-tight">
						profile
					</h1>
					<Link
						href="/profile/edit"
						className="flex items-center gap-1 text-sm font-bold text-gray-700"
					>
						<Edit className="w-4 h-4" /> edit
					</Link>
				</header>

				{/* Profile Content */}
				<div className="flex flex-col items-center mb-8">
					<div className="relative w-full aspect-square max-w-[240px] mb-4 rounded-[40px] overflow-hidden bg-gray-100 shadow-md">
						{profile.user.image ? (
							<Image
								src={profile.user.image}
								alt={profile.user.name}
								fill
								className="object-cover"
								unoptimized
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<UserIcon className="w-20 h-20 text-gray-400" />
							</div>
						)}
					</div>

					<div className="text-left w-full max-w-[240px]">
						<h2 className="text-2xl font-black text-gray-900 mb-1">
							{profile.user.name}
						</h2>
						<p className="text-base font-bold text-gray-800 mb-3">
							@{profile.user.username || "not_me"}
						</p>
						<div className="flex items-center gap-3 text-xs font-bold text-gray-600">
							<Link href="/friends?tab=followers">
								<span className="text-black text-sm">
									{profile.stats.followerCount}
								</span>{" "}
								フォロワー
							</Link>
							<Link href="/friends?tab=following">
								<span className="text-black text-sm">
									{profile.stats.followingCount}
								</span>{" "}
								フォロー
							</Link>
							<Link href="/friends/requests">
								<span className="text-black text-sm">
									{profile.stats.requestCount}
								</span>{" "}
								リクエスト
							</Link>
						</div>
					</div>
				</div>

				{/* Graph Section */}
				<div className="bg-[#99D9F8] rounded-3xl p-5 mb-4 text-white relative shadow-sm overflow-hidden min-h-[180px] flex flex-col">
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs font-black tracking-widest opacity-90">
							max
						</span>
						<button
							type="button"
							onClick={() => setShowGraphHelp(true)}
							className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full backdrop-blur-sm transition-all active:scale-90 shadow-inner"
						>
							<div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center text-[11px] font-black">
								?
							</div>
						</button>
					</div>

					<div className="flex-1 flex items-end">
						<UserGraph
							graphData={profile.graph.map((g) => ({
								label: g.label,
								minutes: g.minutes,
							}))}
							scaleMax={profile.user.maxMinutes}
						/>
					</div>
					<div className="absolute bottom-2 right-4 text-[10px] font-black opacity-80">
						day
					</div>
				</div>

				{/* Change Stamps Button */}
				<div className="flex justify-end mb-8">
					<Link
						href="/profile/stamps/edit"
						className="bg-[#AACCFF] text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-sm"
					>
						スタンプを変更する
					</Link>
				</div>

				{/* Stamp Ranking Section */}
				<div className="mb-10">
					<h3 className="text-center text-sm font-black text-gray-800 mb-4">
						お気に入りスタンプ
					</h3>

					<div className="space-y-2">
						{[0, 1, 2].map((i) => {
							const stamp = profile.favoriteStamps[i];
							const rankLabel = i === 0 ? "1st" : i === 1 ? "2nd" : "3rd";
							const rankColors =
								i === 0
									? "from-[#FF9EAE] to-[#D6B5FF]"
									: i === 1
										? "from-[#FFF6A2] to-[#B2E4A9]"
										: "from-[#99D9F8] to-[#B2E4A9]";

							return (
								<div
									key={rankLabel}
									className="flex items-center gap-3 bg-white rounded-xl py-2 px-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-50"
								>
									<div
										className={`w-20 h-10 flex items-center justify-center rounded-lg bg-gradient-to-r ${rankColors} text-white font-black italic text-lg shadow-sm`}
									>
										{rankLabel}
									</div>
									<div className="flex-1 flex items-center gap-4">
										{stamp ? (
											<>
												<div className="relative w-12 h-12">
													<Image
														src={stamp.imageUrl}
														alt={stamp.name}
														fill
														className="object-contain"
														unoptimized
													/>
												</div>
												<span className="text-sm font-bold text-gray-700">
													{stamp.name}
												</span>
											</>
										) : (
											<span className="text-xs font-medium text-gray-300">
												未設定
											</span>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Footer Stats */}
				<div className="bg-[#99D9F8] rounded-[28px] p-4 text-white flex justify-between items-center shadow-md border-b-4 border-[#88C8E8]">
					{/* Max Streak */}
					<div className="flex flex-col items-center flex-1 border-r border-white/30 px-1">
						<div className="flex items-center gap-1 mb-1 opacity-90 scale-90">
							<Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
							<span className="text-[9px] font-black">最大継続日数</span>
						</div>
						<span className="text-base font-black tracking-tight">
							{profile.user.maxStreak}日
						</span>
					</div>

					{/* Total Stamps */}
					<div className="flex flex-col items-center flex-1 border-r border-white/30 px-1">
						<div className="flex items-center gap-1 mb-1 opacity-90 scale-90">
							<Trophy className="w-3 h-3 text-yellow-300" />
							<span className="text-[9px] font-black">合計スタンプ所持数</span>
						</div>
						<span className="text-base font-black tracking-tight">
							{profile.stats.totalStampCount}個
						</span>
					</div>

					{/* Total Duration */}
					<div className="flex flex-col items-center flex-1 px-1">
						<div className="flex items-center gap-1 mb-1 opacity-90 scale-90">
							<Clock className="w-3 h-3 text-white" />
							<span className="text-[9px] font-black">合計運動時間</span>
						</div>
						<span className="text-base font-black tracking-tight">
							{profile.user.totalDuration}分
						</span>
					</div>
				</div>
			</div>

			<BottomNav />
		</div>
	);
}
