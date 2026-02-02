"use client";

import { Flame, Maximize2, MoreHorizontal, MoveUpRight } from "lucide-react";

interface GraphPoint {
	label: string;
	minutes: number;
	type: string;
}

interface FriendData {
	user: {
		name: string;
		image: string | null;
		characterName: string | null;
		level: number;
	};
	stats: {
		currentStreak: number;
		maxStreak: number;
		todayExerciseMinutes: number;
		maxExerciseMinutes: number;
		graphData: GraphPoint[];
	};
	quote: {
		text: string;
	} | null;
}

interface FriendActivityCardProps {
	friend: FriendData;
}

export function FriendActivityCard({ friend }: FriendActivityCardProps) {
	// Gradient for friend card - matching blue/cyan/yellow vibe from mockup
	const gradientClass =
		"bg-gradient-to-br from-sky-400 via-cyan-300 to-teal-200";

	// Find simple max for graph scaling
	const maxValue = Math.max(
		...friend.stats.graphData.map((d) => d.minutes),
		60,
	);

	return (
		<div className="flex flex-col gap-2 px-4">
			{/* Friend Header */}
			<div className="flex items-center justify-between px-1">
				<div className="flex items-center gap-3">
					{/* Avatar */}
					<div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden shrink-0 border border-white shadow-sm">
						{friend.user.image ? (
							<>
								{/* eslint-disable @next/next/no-img-element */}
								{/* biome-ignore lint/performance/noImgElement: dynamic user content */}
								<img
									src={friend.user.image}
									alt={friend.user.name}
									className="h-full w-full object-cover"
								/>
								{/* eslint-enable @next/next/no-img-element */}
							</>
						) : (
							<div className="h-full w-full bg-gray-300" />
						)}
					</div>
					{/* Name & Title */}
					<div className="flex flex-col">
						<span className="text-sm font-bold text-slate-900 leading-tight">
							{friend.user.name}
						</span>
						<span className="text-xs text-gray-400 font-medium">
							{friend.user.characterName || "なりきったキャラ"}
						</span>
					</div>
				</div>

				{/* Menu Icon */}
				<button type="button" className="text-gray-400">
					<MoreHorizontal className="h-5 w-5" />
				</button>
			</div>

			{/* Stats Card */}
			<div
				className={`rounded-3xl p-5 text-white shadow-lg ${gradientClass} relative overflow-hidden`}
			>
				{/* Background Texture/Shine */}
				<div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

				{/* Expand Icon */}
				<div className="absolute top-4 right-4">
					<Maximize2 className="h-4 w-4 opacity-80" />
				</div>

				{/* Header: Fire + Level */}
				<div className="flex items-center gap-3 mb-6">
					<div className="relative flex items-center justify-center">
						<Flame className="h-10 w-10 text-orange-600 fill-orange-500 drop-shadow-md" />
						<span className="absolute text-[10px] font-bold text-white pt-1">
							{friend.stats.currentStreak}
						</span>
					</div>
					<span className="text-2xl font-black italic tracking-wide drop-shadow-md">
						Lv.{friend.user.level}
					</span>
				</div>

				{/* Content: Graph + Text Stats */}
				<div className="flex gap-4 mb-6">
					{/* Graph Area */}
					<div className="flex-1 flex items-end justify-between gap-1 h-24 pb-1">
						{friend.stats.graphData.map((point, i) => {
							const heightPercent = Math.min(
								(point.minutes / maxValue) * 100,
								100,
							);
							const isToday = i === friend.stats.graphData.length - 1;
							return (
								<div
									key={point.label || i}
									className="flex flex-col items-center gap-1 w-1/4"
								>
									<div
										className={`w-full rounded-t-sm transition-all duration-500 ${isToday ? "bg-yellow-300" : "bg-white/30"}`}
										style={{ height: `${Math.max(heightPercent, 10)}%` }} // Min height
									/>
								</div>
							);
						})}
					</div>

					{/* Stats Text */}
					<div className="flex-1 space-y-1 py-1 text-right">
						<div className="flex items-center justify-end gap-1">
							<span className="text-xs font-medium opacity-90">
								本日の運動時間 :
							</span>
							<span className="text-sm font-bold">
								{friend.stats.todayExerciseMinutes}分
							</span>
						</div>
						<div className="flex items-center justify-end gap-1">
							<span className="text-xs font-medium opacity-90">
								最大連続日数 :
							</span>
							<span className="text-sm font-bold">
								{friend.stats.maxStreak}日
							</span>
							<MoveUpRight className="h-3 w-3 text-yellow-300" />
						</div>
						<div className="flex items-center justify-end gap-1">
							<span className="text-xs font-medium opacity-90">
								最大運動時間 :
							</span>
							<span className="text-sm font-bold">
								{friend.stats.maxExerciseMinutes}分
							</span>
						</div>
					</div>
				</div>

				{/* Quote Footer - Reusing system quote or friend's quote if available */}
				<div className="border-t border-white/20 pt-3">
					<p className="font-bold text-sm mb-1">[今日の一言]</p>
					<p className="text-xs font-medium opacity-90 leading-relaxed">
						{friend.quote?.text || "運動せざる者、健康得るべからず。"}
					</p>
				</div>
			</div>
		</div>
	);
}
