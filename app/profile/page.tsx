"use client";

import { Clock, Edit, Flame, Trophy, User as UserIcon } from "lucide-react"; // Import icons
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
		date: string; // YYYY-MM-DD
		minutes: number;
		isMax: boolean;
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

	// Graph Logic
	// Use monthMaxMinutes for scaling, unless current week has a higher value (edge case)
	// Actually, the requirements say "updated every time max is exceeded".
	// We'll use the larger of monthMaxMinutes or the local max in graph.
	const localMax = Math.max(...profile.graph.map((g) => g.minutes));
	const scaleMax = Math.max(profile.stats.monthMaxMinutes, localMax, 30); // Min scale 30m

	return (
		<div className="bg-zinc-50 min-h-screen pb-24 relative">
			{/* Graph Help Modal */}
			{showGraphHelp && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop
				// biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					onClick={() => setShowGraphHelp(false)}
				>
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content */}
					<div
						className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl relative"
						onClick={(e) => e.stopPropagation()}
					>
						<h3 className="text-lg font-bold mb-2">グラフについて</h3>
						<p className="text-sm text-gray-600 leading-relaxed">
							このグラフの縦軸（max）は、過去30日間で一番運動した日の記録を基準にしています。
							<br />
							その日の記録を超えると、新しい基準として更新されます。
						</p>
						<button
							type="button"
							className="mt-4 w-full bg-sky-400 text-white font-bold py-2 rounded-full"
							onClick={() => setShowGraphHelp(false)}
						>
							閉じる
						</button>
					</div>
				</div>
			)}

			{/* Header */}
			<header className="flex items-center justify-between py-4 px-1">
				{/* Empty left for spacing/balance if Back button is removed as per req, but user said "left top back button not needed" */}
				<div className="w-10" />
				<h1 className="text-lg font-bold text-gray-800">プロフィール</h1>
				<Link
					href="/profile/edit"
					className="flex items-center gap-1 text-sm font-bold text-gray-700"
				>
					<Edit className="w-4 h-4" /> 編集
				</Link>
			</header>

			{/* User Info Card */}
			<div className="bg-white rounded-3xl p-6 shadow-sm mb-6 relative overflow-hidden">
				{/* Blue Border Effect (optional, following image style) */}
				<div className="absolute top-0 left-0 w-full h-full border-2 border-blue-400/30 rounded-3xl pointer-events-none" />

				{/* Icon */}
				<div className="w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-2xl overflow-hidden bg-gray-200">
					{profile.user.image ? (
						<Image
							src={profile.user.image}
							alt={profile.user.name}
							fill
							className="object-cover"
							unoptimized
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gray-100">
							<UserIcon className="w-16 h-16 text-gray-400" />
						</div>
					)}
				</div>

				{/* Name & ID */}
				<div className="mb-4">
					<h2 className="text-xl font-bold text-gray-900">
						{profile.user.name}
					</h2>
					<p className="text-sm text-gray-500 font-medium">
						@{profile.user.username || "not_me"}
					</p>
				</div>

				{/* Counts */}
				<div className="flex items-center gap-4 text-xs font-bold text-gray-600">
					<Link href="/friends" className="hover:opacity-70 transition-opacity">
						<span className="text-black text-sm">
							{profile.stats.followerCount}
						</span>{" "}
						フォロワー
					</Link>
					<Link href="/friends" className="hover:opacity-70 transition-opacity">
						<span className="text-black text-sm">
							{profile.stats.followingCount}
						</span>{" "}
						フォロー
					</Link>
					<Link
						href="/friends/requests"
						className="hover:opacity-70 transition-opacity"
					>
						<span className="text-black text-sm">
							{profile.stats.requestCount}
						</span>{" "}
						リクエスト
					</Link>
				</div>
			</div>

			{/* Graph Section */}
			<div className="bg-sky-400 rounded-3xl p-5 mb-6 text-white relative shadow-md overflow-hidden">
				<div className="flex justify-between items-start mb-8 text-xs font-bold opacity-80">
					<span>max</span>
					<button
						type="button"
						onClick={() => setShowGraphHelp(true)}
						className="p-1 hover:bg-white/10 rounded-full transition-colors"
					>
						<span className="block w-4 h-4 border border-white rounded-full flex items-center justify-center text-[10px]">
							?
						</span>
					</button>
				</div>

				<div className="flex items-end justify-between h-32 gap-2 relative z-10">
					{profile.graph.map((day) => {
						// Calculate height percentage
						const heightPercent = Math.min((day.minutes / scaleMax) * 100, 100);
						// Label logic: Last one is 31 (date), others roughly?
						// Requirement: "Rightmost is today". X-axis: dates.
						// We'll show the day number (e.g. 25, 26...).
						const dateLabel = new Date(day.date).getDate();

						return (
							<div
								key={day.date}
								className="flex flex-col items-center gap-1 flex-1"
							>
								<div className="h-full w-full flex items-end justify-center">
									<div
										className={`w-full max-w-[24px] rounded-t-sm transition-all duration-500 ${
											day.isMax ? "bg-yellow-300" : "bg-gray-400/60"
										}`}
										style={{ height: `${Math.max(heightPercent, 5)}%` }} // Min height 5%
									/>
								</div>
								<span className="text-[10px] font-bold">{dateLabel}</span>
							</div>
						);
					})}
				</div>
				{/* Background lines could go here */}
				<div className="absolute bottom-6 left-0 w-full h-[1px] bg-white/20" />
				<span className="absolute bottom-2 right-4 text-[10px] font-bold">
					day
				</span>
			</div>

			{/* Stamp Ranking Section */}
			<div className="bg-yellow-50 rounded-3xl p-6 mb-6 shadow-sm border border-yellow-100 relative">
				<h3 className="text-center text-sm font-bold text-gray-800 mb-6">
					私の好きなスタンプランキング
				</h3>

				<div className="flex items-end justify-center gap-2 mb-8">
					{/* 2nd Place */}
					<div className="flex flex-col items-center w-1/3">
						<span className="bg-gray-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
							2位
						</span>
						{profile.favoriteStamps[1] ? (
							<>
								<div className="relative w-12 h-12 mb-1 drop-shadow-sm">
									<Image
										src={profile.favoriteStamps[1].imageUrl}
										alt="2nd"
										fill
										className="object-contain"
										unoptimized
									/>
								</div>
								<div className="h-10 w-full bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg shadow-inner" />
							</>
						) : (
							<div className="h-10 w-full bg-gray-200 rounded-t-lg opacity-50" />
						)}
					</div>

					{/* 1st Place */}
					<div className="flex flex-col items-center w-1/3 z-10">
						<span className="bg-yellow-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full mb-1 shadow-sm">
							1位
						</span>
						{profile.favoriteStamps[0] ? (
							<>
								<div className="relative w-16 h-16 mb-1 drop-shadow-md">
									<Image
										src={profile.favoriteStamps[0].imageUrl}
										alt="1st"
										fill
										className="object-contain"
										unoptimized
									/>
								</div>
								<div className="h-16 w-full bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-t-lg shadow-lg relative">
									{/* Shine effect */}
									<div className="absolute top-0 right-0 w-full h-full bg-white/20 rounded-t-lg" />
								</div>
							</>
						) : (
							<div className="h-16 w-full bg-yellow-200 rounded-t-lg opacity-50" />
						)}
					</div>

					{/* 3rd Place */}
					<div className="flex flex-col items-center w-1/3">
						<span className="bg-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
							3位
						</span>
						{profile.favoriteStamps[2] ? (
							<>
								<div className="relative w-12 h-12 mb-1 drop-shadow-sm">
									<Image
										src={profile.favoriteStamps[2].imageUrl}
										alt="3rd"
										fill
										className="object-contain"
										unoptimized
									/>
								</div>
								<div className="h-8 w-full bg-gradient-to-b from-orange-300 to-orange-400 rounded-t-lg shadow-inner" />
							</>
						) : (
							<div className="h-8 w-full bg-orange-200 rounded-t-lg opacity-50" />
						)}
					</div>
				</div>

				<div className="text-center">
					<Link
						href="/profile/stamps/edit"
						className="inline-block bg-blue-400/20 text-blue-500 text-xs font-bold px-6 py-2 rounded-full hover:bg-blue-400/30 transition-colors"
					>
						スタンプを変更する
					</Link>
				</div>
			</div>

			{/* Footer Stats */}
			<div className="bg-sky-400 rounded-2xl p-4 text-white flex justify-between items-center shadow-lg">
				{/* Max Streak */}
				<div className="flex flex-col items-center flex-1 border-r border-white/20">
					<div className="flex items-center gap-1 mb-1">
						<Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
						<span className="text-[10px] font-bold opacity-90">
							最大継続日数
						</span>
					</div>
					<span className="text-lg font-bold">{profile.user.maxStreak}日</span>
				</div>

				{/* Total Stamps */}
				<div className="flex flex-col items-center flex-1 border-r border-white/20">
					<div className="flex items-center gap-1 mb-1">
						<Trophy className="w-3 h-3 text-yellow-300" />
						<span className="text-[10px] font-bold opacity-90">
							合計スタンプ所持数
						</span>
					</div>
					<span className="text-lg font-bold">
						{profile.stats.totalStampCount}個
					</span>
				</div>

				{/* Total Duration */}
				<div className="flex flex-col items-center flex-1">
					<div className="flex items-center gap-1 mb-1">
						<Clock className="w-3 h-3 text-white" />
						<span className="text-[10px] font-bold opacity-90">
							合計運動時間
						</span>
					</div>
					<span className="text-lg font-bold">
						{profile.user.totalDuration}分
					</span>
				</div>
			</div>
		</div>
	);
}
