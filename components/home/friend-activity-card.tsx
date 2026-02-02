"use client";

import { Flame, MoveUpRight, User } from "lucide-react";

interface GraphPoint {
	label: string;
	minutes: number;
	type: string;
}

export interface FriendData {
	user: {
		id: string;
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
	// Determine card gradient based on level (simplified logic similar to StatsCard)
	const getGradient = (lvl: number) => {
		if (lvl >= 100)
			return "bg-gradient-to-br from-red-500 via-red-400 to-orange-400";
		if (lvl >= 50)
			return "bg-gradient-to-br from-yellow-400 via-yellow-300 to-green-300";
		return "bg-gradient-to-br from-blue-400 via-sky-300 to-teal-300";
	};

	const gradientClass = getGradient(friend.user.level);

	// Ensure at least 60 for scale calculation to avoid division by zero or huge bars for small numbers
	const maxValue = Math.max(
		...friend.stats.graphData.map((d) => d.minutes),
		60,
	);

	return (
		<div
			className={`mx-4 rounded-3xl p-5 text-white shadow-lg ${gradientClass} relative overflow-hidden`}
		>
			{/* Background Texture similar to StatsCard */}
			<div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

			{/* Friend Info Header */}
			<div className="flex items-center gap-3 mb-4">
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
						<div className="h-full w-full flex items-center justify-center bg-white/20">
							<User className="h-6 w-6 text-white" />
						</div>
					)}
				</div>

				<div className="flex flex-col">
					<div className="flex items-center gap-2">
						<span className="font-bold text-lg leading-tight">
							{friend.user.name}
						</span>
						<span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
							Lv.{friend.user.level}
						</span>
					</div>
					{friend.user.characterName && (
						<span className="text-xs opacity-90">
							{friend.user.characterName}
						</span>
					)}
				</div>

				{/* Streak Badge */}
				<div className="ml-auto flex flex-col items-center">
					<Flame className="h-6 w-6 text-orange-600 fill-orange-500 drop-shadow-sm" />
					<span className="text-xs font-bold">
						{friend.stats.currentStreak}日
					</span>
				</div>
			</div>

			{/* Content: Graph + Text Stats */}
			<div className="flex gap-4 mb-4">
				{/* Graph Area - slightly smaller than main StatsCard */}
				<div className="flex-1 flex items-end justify-between gap-1 h-16 pb-1">
					{friend.stats.graphData.map((point, i) => {
						const heightPercent = Math.min(
							(point.minutes / maxValue) * 100,
							100,
						);
						const isToday = i === friend.stats.graphData.length - 1;
						return (
							<div
								key={point.label}
								className="flex flex-col items-center gap-1 w-1/4"
							>
								<div
									className={`w-full rounded-t-sm transition-all duration-500 ${isToday ? "bg-yellow-300" : "bg-white/30"}`}
									style={{ height: `${Math.max(heightPercent, 10)}%` }}
								/>
							</div>
						);
					})}
				</div>

				{/* Stats Text */}
				<div className="flex-1 space-y-1 py-1 text-right">
					<div className="flex items-center justify-end gap-1">
						<span className="text-[10px] font-medium opacity-90">
							今日の運動:
						</span>
						<span className="text-sm font-bold">
							{friend.stats.todayExerciseMinutes}分
						</span>
					</div>
					<div className="flex items-center justify-end gap-1">
						<span className="text-[10px] font-medium opacity-90">
							最大連続:
						</span>
						<span className="text-sm font-bold">
							{friend.stats.maxStreak}日
						</span>
						<MoveUpRight className="h-3 w-3 text-yellow-300" />
					</div>
				</div>
			</div>

			{/* Quote Footer - Simplified for Friend */}
			{friend.quote && (
				<div className="border-t border-white/20 pt-2">
					<p className="text-[10px] font-medium opacity-80 leading-relaxed truncate">
						&quot;{friend.quote.text}&quot;
					</p>
				</div>
			)}
		</div>
	);
}
