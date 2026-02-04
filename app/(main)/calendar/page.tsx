"use client";

import { ChevronRight } from "lucide-react";
// import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { GachaModal } from "@/components/calendar/gacha-modal";
import { LevelProgress } from "@/components/calendar/level-progress";
import { apiClient } from "@/lib/api-client";

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

	// Gacha Logic
	const triggerGacha = useCallback(async () => {
		const res = await apiClient.api.calendar.gacha.$post();
		if (res.ok) {
			const json = await res.json();
			if ("error" in json) {
				// alert(json.error);
				return;
			}

			if ("stamp" in json) {
				setNewStamp(json.stamp);
				setIsGachaOpen(true);
			}
		}
	}, []);

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
				const calendarData = json as CalendarData;
				setData(calendarData);

				// Auto-trigger Gacha if level up is ready
				if (calendarData.isLevelUpReady) {
					// Slight delay for UX
					setTimeout(() => {
						triggerGacha();
					}, 500);
				}
			}
		};
		fetchCalendar();
		// Adding triggerGacha to dependency array might cause loops if not careful,
		// but since triggerGacha is stable (if check is strictly on isLevelUpReady from fresh fetch), it should be fine.
		// To be strictly safe, we can suppress the dependency warning or wrap triggerGacha in useCallback.
		// For now, let's just use it.
	}, [currentDate, triggerGacha]);

	// const handlePrevMonth = () => {
	// 	setCurrentDate(
	// 		new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
	// 	);
	// };

	// const handleNextMonth = () => {
	// 	setCurrentDate(
	// 		new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
	// 	);
	// };

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
			{/* ヘッダー（月 / 継続記録） */}
			<div className="pt-8 pb-[20px] flex items-center justify-between">
				<div className="flex items-center gap-1">
					<span className="text-[20px] font-bold tracking-tight ml-[15px]">
						{data.month}
						{/* <span className="text-[20px]">月</span> */}
					</span>
					<ChevronRight className="rotate-90 h-5 w-5 text-gray-400 mt-1" />
				</div>

				<div className="flex items-center gap-2">
					{/* {data.currentStreak > 0 && (
						<div className="bg-sky-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
							<span className="text-orange-300 text-sm">🔥</span>{" "}
							{data.currentStreak}日継続中
						</div>
					)} */}
					{/* テスト用継続日数 */}
					<div className="bg-sky-400 text-white px-3 py-1.5 rounded-[10px] font-bold flex items-center gap-1 shadow-sm">
						<span className="text-orange-300 text-sm">
							<Image
								src="/sample/fire.png"
								alt="炎"
								width={15}
								height={15}
								// style={{ width: "auto", height: "auto" }}
							/>
						</span>{" "}
						{data.currentStreak}日継続中
					</div>
				</div>
			</div>

			{/* Month Navigation (Invisible or swipe, but adding buttons for usability now) */}
			{/* Ideally swipe, but adding simple arrows for now */}
			{/* 横移動ボタン */}
			{/* <div className="flex justify-end gap-4 mb-4">
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
			</div> */}

			{/* カレンダー */}
			<div>
				<div className="border-1 border-slate-800 rounded-[15px] py-4 px-1 bg-[#F1FAFF] relative overflow-hidden shadow-sm">
					{/* 曜日 */}
					<div className="grid grid-cols-7 mb-4">
						{DAYS_OF_WEEK.map((day, i) => (
							<div
								key={day}
								className={`text-center font-bold ${
									i === 0
										? "text-red-500"
										: i === 6
											? "text-blue-500"
											: "text-slate-900"
								}`}
							>
								{day}
							</div>
						))}
					</div>

					{/* 日付 */}
					<div className="grid grid-cols-7 gap-y-4 gap-x-1">
						{(() => {
							const year = data.year;
							const month = data.month;
							const firstDayOfMonth = new Date(year, month - 1, 1);
							const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)

							const prevMonthLastDate = new Date(year, month - 1, 0).getDate();
							const daysInMonth = new Date(year, month, 0).getDate();

							const cells = [];

							// Previous Month Filler
							for (let i = 0; i < startDayOfWeek; i++) {
								const dayNum = prevMonthLastDate - startDayOfWeek + 1 + i;
								cells.push(
									<div
										key={`prev-${dayNum}`}
										className="flex flex-col items-center justify-start gap-1 h-16 opacity-30"
									>
										<span className="text-[20px] font-bold text-slate-400">
											{dayNum}
										</span>
										<div className="w-8 h-8 rounded-full bg-slate-300" />
									</div>,
								);
							}

							// Current Month
							for (let d = 1; d <= daysInMonth; d++) {
								const dayData = data.days.find((day) => day.day === d);
								const isSunday = new Date(year, month - 1, d).getDay() === 0;
								const isSaturday = new Date(year, month - 1, d).getDay() === 6;
								const isHoliday = month === 4 && d === 29; // Demo: Showa Day

								// 曜日の色分けロジック
								const dayLabelColor =
									isSunday || isHoliday
										? "text-red-500"
										: isSaturday
											? "text-blue-500"
											: "text-slate-900";

								cells.push(
									<div
										key={`curr-${d}`}
										className="flex flex-col items-center justify-start gap-1 h-16 relative group"
									>
										{/* Day Number */}
										<span className={`text-xl font-bold ${dayLabelColor} z-10`}>
											{d}
										</span>

										{/* Circle Placeholder */}
										<div className="w-8 h-8 rounded-full bg-slate-300 absolute top-8" />

										{/* Stamp Overlay */}
										{dayData?.stamp?.imageUrl && (
											<div className="absolute top-4 w-14 h-14 z-20 transform -rotate-6 hover:scale-110 transition-transform">
												<Image
													src={dayData.stamp.imageUrl}
													alt={dayData.stamp.name}
													fill
													className="object-contain drop-shadow-md"
													unoptimized
												/>
											</div>
										)}
									</div>,
								);
							}

							// Next Month Filler (to complete the last row)
							const totalCells = cells.length;
							const remaining = 7 - (totalCells % 7);
							if (remaining < 7) {
								for (let i = 1; i <= remaining; i++) {
									cells.push(
										<div
											key={`next-${i}`}
											className="flex flex-col items-center justify-start gap-1 h-16 opacity-30"
										>
											<span className="text-xl font-bold text-slate-400">
												{i}
											</span>
											<div className="w-8 h-8 rounded-full bg-slate-300" />
										</div>,
									);
								}
							}

							return cells;
						})()}
					</div>
				</div>
			</div>

			{/* レベル/記録 */}
			<div className="mt-4 space-y-4">
				<LevelProgress
					level={data.level}
					progress={data.missionProgress}
					isLevelUpReady={data.isLevelUpReady}
					onGachaClick={handleGachaDraw}
				/>

				{/* 統計カード */}
				<div className="bg-gradient-to-r from-sky-400 to-cyan-300 text-white rounded-[15px] p-2 shadow-md flex justify-between items-center text-center">
					<div className="flex-1">
						<div className="text-[12px] font-bold opacity-90 mb-1 flex items-center justify-center gap-1">
							<span className="text-orange-300">
								<Image
									src="/sample/fire.png"
									alt="炎"
									width={15}
									height={15}
									// style={{ width: "auto", height: "auto" }}
								/>
							</span>{" "}
							最大継続日数
						</div>
						<div className="font-bold">
							{data.stats.maxStreak}
							<span className="text-xs font-normal ml-0.5 opacity-80">日</span>
						</div>
					</div>
					<div className="flex-1">
						<div className="text-[12px] font-bold opacity-90 mb-1">
							合計スタンプ所持数
						</div>
						<div className="font-bold">
							{data.stats.totalStamps}
							<span className="text-xs font-normal ml-0.5 opacity-80">個</span>
						</div>
					</div>
					<div className="flex-1">
						<div className="text-[12px] font-bold opacity-90 mb-1">
							合計運動時間
						</div>
						<div className="font-bold">
							{data.stats.totalDuration}
							<span className="text-xs font-normal ml-0.5 opacity-80">分</span>
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

// Helper for days of week
const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"];
