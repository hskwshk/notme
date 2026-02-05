"use client";

import {
	Flame,
	Maximize2,
	MoreHorizontal,
	MoveUpRight,
	User,
} from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { UserGraph } from "./user-graph";

interface GraphPoint {
	label: string;
	minutes: number;
	type: string;
}

export interface ActivityData {
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
	quote: string | null;
}

interface ActivityCardProps {
	data: ActivityData;
	colorIndex: number; // 0, 1, 2 for cycling colors
	isSelf?: boolean;
}

export function ActivityCard({
	data,
	colorIndex,
	isSelf = false,
}: ActivityCardProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	// Mockup colors:
	// 0: Purple/Pink to Magenta
	// 1: Yellow/Amber to Orange
	// 2: Blue/Sky to Cyan
	const gradients = [
		"bg-gradient-to-b from-[#F284FF] via-[#FF69B4] to-[#FFFFFF]", // Purple/Pink
		"bg-gradient-to-b from-[#FFF500] via-[#FFD700] to-[#FFFFFF]", // Yellow
		"bg-gradient-to-b from-[#87CEEB] via-[#00BFFF] to-[#FFFFFF]", // Blue
	];

	const themeColor = gradients[colorIndex % gradients.length];

	const handleUnfollow = async () => {
		if (isSelf) return;
		if (!confirm(`${data.user.name}さんを友達から削除しますか？`)) return;

		// @ts-expect-error: RPC type instantiation depth issue
		const res = await apiClient.api.users[":id"].friend.$delete({
			param: { id: data.user.id },
		});

		if (res.ok) {
			window.location.reload();
		} else {
			alert("削除に失敗しました");
		}
	};

	return (
		<div className="flex flex-col gap-3 mb-8 w-full max-w-md mx-auto">
			{/* Header: User Info */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="size-12 rounded-full bg-slate-200 overflow-hidden shrink-0 shadow-sm border border-white">
						{data.user.image ? (
							/* eslint-disable @next/next/no-img-element */
							// biome-ignore lint/performance/noImgElement: dynamic user content
							<img
								src={data.user.image}
								alt={data.user.name}
								className="size-full object-cover"
							/>
						) : (
							<div className="size-full flex items-center justify-center bg-slate-300">
								<User className="size-6 text-white" />
							</div>
						)}
					</div>
					<div className="flex flex-col">
						<span className="text-base font-black text-slate-800 leading-tight">
							{data.user.name}
						</span>
						<span className="text-[13px] text-slate-400 font-bold">
							{data.user.characterName || "なりきったキャラ"}
						</span>
					</div>
				</div>

				<div className="relative">
					<button
						type="button"
						onClick={() => setIsMenuOpen(!isMenuOpen)}
						className="p-1 hover:bg-slate-100 rounded-full transition-colors"
					>
						<MoreHorizontal className="size-6 text-slate-800" />
					</button>
					{isMenuOpen && !isSelf && (
						<>
							<button
								type="button"
								className="fixed inset-0 z-10 w-full h-full cursor-default"
								onClick={() => setIsMenuOpen(false)}
								aria-label="Close menu"
							/>
							<div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl shadow-xl border border-slate-100 z-20 overflow-hidden font-bold">
								<button
									type="button"
									onClick={handleUnfollow}
									className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
								>
									友達を解除
								</button>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Main Content Card */}
			<div className="relative rounded-[40px] shadow-sm border border-white/50 bg-white overflow-hidden">
				{/* Top Gradient Area */}
				<div
					className={`h-24 w-full ${themeColor} relative flex items-center px-6`}
				>
					<div className="flex items-center gap-2">
						<div className="relative flex items-center justify-center">
							<Flame className="size-11 text-orange-500 fill-orange-400 drop-shadow-[0_2px_4px_rgba(255,165,0,0.5)]" />
							<span className="absolute text-xl font-black text-white italic mt-1 ml-0.5">
								{data.stats.currentStreak}
							</span>
						</div>
						<div className="text-3xl font-black text-slate-800 italic tracking-tighter ml-1">
							Lv.{data.user.level}
						</div>
					</div>
					<div className="absolute top-6 right-6">
						<Maximize2 className="size-6 text-slate-400 rotate-90" />
					</div>
				</div>

				{/* Middle: Graph & Stats */}
				<div className="p-6">
					<div className="flex gap-4 mb-4">
						{/* Graph */}
						<div className="flex-1 max-w-[55%] h-32">
							<UserGraph
								graphData={data.stats.graphData}
								scaleMax={data.stats.maxExerciseMinutes}
								isPrimary={true}
							/>
						</div>
						{/* Text Stats */}
						<div className="flex-1 flex flex-col justify-center space-y-1">
							<div className="flex items-center gap-1">
								<span className="text-[13px] font-black text-slate-800">
									本日の運動時間 :
								</span>
								<span className="text-[13px] font-black text-slate-800">
									{data.stats.todayExerciseMinutes}分
								</span>
							</div>
							<div className="flex items-center gap-1 group">
								<span className="text-[13px] font-black text-slate-800">
									最大連続日数 :
								</span>
								<span className="text-[13px] font-black text-slate-800">
									{data.stats.maxStreak}日
								</span>
								<MoveUpRight className="size-6 text-yellow-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
							</div>
							<div className="flex items-center gap-1">
								<span className="text-[13px] font-black text-slate-800">
									最大運動時間 :
								</span>
								<span className="text-[13px] font-black text-slate-800">
									{data.stats.maxExerciseMinutes}分
								</span>
							</div>
						</div>
					</div>

					{/* Bottom: Quote */}
					<div className="mt-2">
						<p className="font-black text-xl text-slate-800 mb-1">
							[今日の一言]
						</p>
						<p className="font-bold text-[15px] text-slate-600 leading-tight">
							{data.quote || "運動せざる者、健康得るべからず。"}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
