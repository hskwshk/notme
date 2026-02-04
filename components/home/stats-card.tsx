"use client";

import { Flame, Maximize2, MoveUpRight } from "lucide-react";

interface GraphPoint {
	label: string;
	minutes: number;
	type: string;
}

interface StatsCardProps {
	level: number;
	currentStreak: number;
	maxStreak: number;
	todayMinutes: number;
	maxMinutes: number;
	monthMaxMinutes: number;
	graphData: GraphPoint[];
	quote: string | null;
}

export function StatsCard({
	level,
	currentStreak,
	maxStreak,
	todayMinutes,
	maxMinutes,
	monthMaxMinutes,
	graphData,
	quote,
}: StatsCardProps) {
	// Determine card gradient based on level (example logic)
	const getGradient = (lvl: number) => {
		if (lvl >= 100)
			return "bg-gradient-to-br from-red-500 via-red-400 to-orange-400"; // High level
		if (lvl >= 50)
			return "bg-gradient-to-br from-yellow-400 via-yellow-300 to-green-300"; // Mid level
		return "bg-gradient-to-br from-blue-400 via-sky-300 to-teal-300"; // Low/Start level
	};

	const gradientClass = getGradient(level);

	// Y-axis scale max (at least 60 mins or month max)
	const scaleMax = Math.max(monthMaxMinutes, 60);

	return (
		<div
			className={`rounded-3xl p-[12px] text-white shadow-lg ${gradientClass} relative overflow-hidden`}
		>
			{/* Background Texture/Shine */}
			<div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>

			{/* 拡張ボタン */}
			<div className="absolute top-5 right-4">
				<Maximize2 className="size-[24px] opacity-80" />
			</div>

			{/* レベル */}
			<div className="flex items-center gap-3 mb-4">
				<div className="relative flex items-center justify-center">
					<Flame className="h-10 w-10 text-orange-600 fill-orange-500 drop-shadow-md" />{" "}
					<span className="absolute text-[20px] font-bold text-black pt-1">
						{currentStreak}
					</span>
				</div>
				<span className="text-2xl font-black tracking-wide drop-shadow-md">
					Lv.{level}
				</span>
			</div>

			{/* メインコンテンツ */}
			<div className="flex gap-4 mb-1 items-stretch">
				{/* グラフ */}
				<div className="flex-1 flex flex-col justify-end pb-2 pr-2 relative h-[120px] w-full max-w-[55%]">
					{/* Y-axis line (max value) */}
					<div className="absolute top-0 left-0 w-full border-t border-white/30 text-[10px] text-white/70">
						<span className="absolute -top-4 left-0">{scaleMax}min</span>
					</div>

					<div className="flex items-end justify-between h-full pt-4 gap-1">
						{graphData.map((point, i) => {
							const heightPercent = Math.min(
								(point.minutes / scaleMax) * 100,
								100,
							);
							// Ensure a tiny bit of height so it's visible even if 0
							const displayHeight = Math.max(heightPercent, 2);
							const isToday = i === graphData.length - 1;

							return (
								<div
									key={point.label || i}
									className="flex flex-col items-center justify-end h-full flex-1 gap-1"
								>
									<div className="w-full h-full flex items-end justify-center relative group">
										<div
											className={`w-3 sm:w-4 rounded-t-sm transition-all duration-500 ${
												isToday ? "bg-yellow-300" : "bg-white/50"
											}`}
											style={{ height: `${displayHeight}%` }}
										/>
										{/* Tooltip for minutes */}
										{point.minutes > 0 && (
											<div className="absolute -top-6 text-[10px] font-bold bg-black/50 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
												{point.minutes}
											</div>
										)}
									</div>
									<span className="text-[9px] opacity-80 whitespace-nowrap overflow-visible">
										{point.label}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* ステータステキスト */}
				<div className="flex-1 space-y-1 py-1">
					<div className="flex items-center justify-start gap-1">
						<span className="font-bold opacity-90">本日の運動時間 :</span>
						<span className="text-sm font-bold">{todayMinutes}分</span>
					</div>
					<div className="flex items-center justify-start gap-1">
						<span className="font-bold opacity-90">最大連続日数 :</span>
						<span className="text-sm font-bold">{maxStreak}日</span>
						<MoveUpRight className="size-[24px] text-yellow-300" />
					</div>
					<div className="flex items-center justify-start gap-1">
						<span className="font-bold opacity-90">最大運動時間 :</span>
						<span className="text-sm font-bold">{maxMinutes}分</span>
					</div>
				</div>
			</div>

			{/* 今日の一言 */}
			<div className="pt-3">
				<p className="font-bold text-[20px] mb-1">[今日の一言]</p>
				<p className="font-medium opacity-90 leading-relaxed">
					{quote || "運動せざる者、健康得るべからず。"}
				</p>
			</div>
		</div>
	);
}
