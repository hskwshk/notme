"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { GachaModal } from "@/components/calendar/gacha-modal";
import { LevelProgress } from "@/components/calendar/level-progress";
import { apiClient } from "@/lib/api-client";

// Helper for days of week
const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

interface CalendarData {
	year: number;
	month: number;
	monthLabel: string;
	currentStreak: number;
	days: {
		date: string;
		day: number;
		isFuture: boolean;
		hasActivity: boolean;
		stamp: {
			name: string;
			imageUrl: string;
		} | null;
	}[];
	level: number;
	missionProgress: {
		current: number;
		required: number;
		remaining: number;
	};
	isLevelUpReady: boolean;
	stats: {
		maxStreak: number;
		totalStamps: number;
		totalDuration: number;
	};
	gacha: {
		canDraw: boolean;
	};
}

export default function CalendarPage() {
	const [data, setData] = useState<CalendarData | null>(null);
	const [currentDate, setCurrentDate] = useState(new Date());

	// Gacha State
	const [isGachaOpen, setIsGachaOpen] = useState(false);
	const [newStamp, setNewStamp] = useState<{
		name: string;
		imageUrl: string;
	} | null>(null);

	useEffect(() => {
		const fetchCalendar = async () => {
			const year = currentDate.getFullYear().toString();
			const month = (currentDate.getMonth() + 1).toString();

			const res = await apiClient.api.calendar.$get({
				query: { year, month },
			});

			if (res.ok) {
				const json = await res.json();
				if ("error" in json) return;
				setData(json as CalendarData);
			}
		};
		fetchCalendar();
	}, [currentDate]);

	const handlePrevMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
		);
	};

	const handleNextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
		);
	};

	const handleGachaDraw = async () => {
		if (!data?.isLevelUpReady) return;

		// Trigger Gacha
		const res = await apiClient.api.calendar.gacha.$post();
		if (res.ok) {
			const json = await res.json();
			if ("error" in json) {
				alert(json.error); // Handle error properly in real app
				return;
			}

			if ("stamp" in json) {
				setNewStamp(json.stamp);
				setIsGachaOpen(true);
				// Refresh data after close, but we can optimistically update level too?
				// Better to refresh after modal close.
			}
		}
	};

	const handleGachaClose = () => {
		setIsGachaOpen(false);
		setNewStamp(null);
		// Trigger refresh
		setCurrentDate(new Date(currentDate));
	};

	if (!data)
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				Loading...
			</div>
		);

	return (
		<div className="min-h-screen bg-[#F2F2F7] pb-32 font-sans text-slate-900">
			{/* Header / Month Selector */}
			<div className="pt-12 px-6 pb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-3xl font-bold">{data.month}月</span>
					<button
						type="button"
						onClick={() => {
							/* Toggle Year Picker? */
						}}
					>
						<ChevronRight className="rotate-90 h-5 w-5 text-gray-400" />
					</button>
				</div>

				<div className="flex items-center gap-2">
					{data.currentStreak > 0 && (
						<div className="bg-slate-800 text-orange-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
							🔥 {data.currentStreak}日連続
						</div>
					)}
				</div>
			</div>

			{/* Month Navigation (Invisible or swipe, but adding buttons for usability now) */}
			{/* Ideally swipe, but adding simple arrows for now */}
			<div className="px-6 flex justify-end gap-4 mb-4">
				<button
					type="button"
					onClick={handlePrevMonth}
					className="p-2 bg-white rounded-full shadow-sm"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<button
					type="button"
					onClick={handleNextMonth}
					className="p-2 bg-white rounded-full shadow-sm"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>

			{/* Calendar Grid */}
			<div className="mx-4 bg-transparent">
				{/* Days Header */}
				<div className="grid grid-cols-7 mb-2">
					{DAYS_OF_WEEK.map((day) => (
						<div
							key={day}
							className="text-center text-xs font-medium text-gray-400"
						>
							{day}
						</div>
					))}
				</div>

				{/* Days Cells */}
				<div className="grid grid-cols-7 gap-y-4 gap-x-2">
					{/* Add offset for start day of month? 
						The API returns Days array starting from 1. 
						We might need empty cells if day 1 is not Sunday.
						Assuming API returns full calendar or we calculate offset.
						Current API logic: `for (let d = 1; d <= daysInMonth; d++)`
						We need to know the weekday of day 1.
					*/}
					{Array.from({
						length: new Date(data.year, data.month - 1, 1).getDay(),
					}).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: stable order for empty slots
						<div key={`empty-${i}`} />
					))}

					{data.days.map((day) => (
						<div
							key={day.day}
							className="flex flex-col items-center gap-1 h-14 relative group"
						>
							{/* Day Number */}
							<span
								className={`
								text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full
								${day.hasActivity ? "bg-slate-900 text-white" : "text-slate-500"}
								${day.isFuture ? "opacity-30" : ""}
							`}
							>
								{day.day}
							</span>

							{/* Stamp Placeholder / Image */}
							<div className="h-8 w-8 flex items-center justify-center">
								{day.stamp ? (
									// biome-ignore lint/performance/noImgElement: dynamic user content without next/image
									<img
										src={day.stamp.imageUrl}
										alt={day.stamp.name}
										className="w-full h-full object-contain"
									/>
								) : day.hasActivity ? (
									// Fallback if no specific stamp but has activity?
									// Or maybe 'stamp' is null implies just a checkmark?
									// API logic: `calculateStampFromLog` returns stamp or null.
									<div className="h-2 w-2 bg-slate-300 rounded-full" />
								) : (
									// Empty circle for past days with no activity?
									!day.isFuture && (
										<div className="h-8 w-8 rounded-full bg-slate-200 opacity-20" />
									)
								)}
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Gamification / Level Section */}
			<div className="mx-4 mt-8 space-y-4">
				<LevelProgress
					level={data.level}
					progress={data.missionProgress}
					isLevelUpReady={data.isLevelUpReady}
					onGachaClick={handleGachaDraw}
				/>

				{/* Stats Row */}
				<div className="grid grid-cols-3 gap-3">
					<div className="bg-[#1C1C1E] rounded-xl p-3 text-white text-center">
						<div className="text-[10px] text-gray-400 mb-1">
							🔥 最大連続日数
						</div>
						<div className="text-xl font-bold">
							{data.stats.maxStreak}
							<span className="text-xs font-normal ml-1">日</span>
						</div>
					</div>
					<div className="bg-[#1C1C1E] rounded-xl p-3 text-white text-center">
						<div className="text-[10px] text-gray-400 mb-1">合計スタンプ数</div>
						<div className="text-xl font-bold">
							{data.stats.totalStamps}
							<span className="text-xs font-normal ml-1">個</span>
						</div>
					</div>
					<div className="bg-[#1C1C1E] rounded-xl p-3 text-white text-center">
						<div className="text-[10px] text-gray-400 mb-1">合計運動時間</div>
						<div className="text-xl font-bold">
							{data.stats.totalDuration}
							<span className="text-xs font-normal ml-1">分</span>
						</div>
					</div>
				</div>
			</div>

			{/* Gacha Modal */}
			<GachaModal
				isOpen={isGachaOpen}
				onClose={handleGachaClose}
				stamp={newStamp}
			/>

			<BottomNav />
		</div>
	);
}
