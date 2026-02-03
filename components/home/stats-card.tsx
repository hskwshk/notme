"use client";

import { Flame, Maximize2, MoveUpRight } from "lucide-react";
import Image from "next/image";

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
	graphData: GraphPoint[];
	quote: string | null;
}

export function StatsCard({
	level,
	currentStreak,
	maxStreak,
	todayMinutes,
	maxMinutes,
	// graphData,
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

	// Find simple max for graph scaling
	// const _maxValue = Math.max(...graphData.map((d) => d.minutes), 60); // Min 60 for scale

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
			<div className="flex gap-4 mb-1 items-center">
				{/* グラフ */}
				<div className="">
					{/* スタイルテスト用画像 */}
					<Image
						src="/sample/graph.png"
						alt="グラフ"
						className="object-cover"
						width={117}
						height={108}
						style={{ width: "auto", height: "auto" }}
						priority
					/>

					{/* {graphData.map((point, i) => {
						const heightPercent = Math.min(
							(point.minutes / maxValue) * 100,
							100,
						);
						const isToday = i === graphData.length - 1;
						return (
							<div
								key={point.label || i}
								className="flex flex-col items-center gap-1 w-1/4"
							>
								<div
									className={`w-full rounded-t-sm transition-all duration-500 ${isToday ? "bg-yellow-300" : "bg-white/30"}`}
									style={{ height: `${Math.max(heightPercent, 10)}%` }} // min height
								/>
							</div>
						);
					})} */}
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
