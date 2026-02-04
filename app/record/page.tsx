"use client";

import { Flame, Minus } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { ConfirmModal } from "@/components/confirm-modal";
import { TimeScrollPicker } from "@/components/time-scroll-picker";
import { apiClient } from "@/lib/api-client";

type Record = {
	id: string;
	startTime: string;
	durationSeconds: number;
};

type RecordData = {
	totalDuration: number;
	records: Record[];
};

export default function RecordPage() {
	const [hours, setHours] = useState(0);
	const [minutes, setMinutes] = useState(0);
	const [seconds, setSeconds] = useState(0);
	const [data, setData] = useState<RecordData>({
		totalDuration: 0,
		records: [],
	});

	// For delete modal
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

	const fetchRecords = useCallback(async () => {
		try {
			const res = await apiClient.api.records.today.$get();
			if (res.ok) {
				const json = await res.json();
				setData(json);
			}
		} catch (error) {
			console.error("Failed to fetch records", error);
		}
	}, []);

	useEffect(() => {
		fetchRecords();
	}, [fetchRecords]);

	const handleRecord = async () => {
		const totalSeconds = hours * 3600 + minutes * 60 + seconds;
		if (totalSeconds === 0) return;

		try {
			const res = await apiClient.api.records.$post({
				json: { durationSeconds: totalSeconds },
			});
			if (res.ok) {
				// Reset input
				setHours(0);
				setMinutes(0);
				setSeconds(0);
				// Refresh list
				fetchRecords();
			}
		} catch (error) {
			console.error("Failed to record", error);
		}
	};

	const handleDeleteRequest = (id: string) => {
		setDeleteTargetId(id);
	};

	const handleDeleteConfirm = async () => {
		if (!deleteTargetId) return;

		try {
			const res = await apiClient.api.records[":id"].$delete({
				param: { id: deleteTargetId },
			});
			if (res.ok) {
				fetchRecords();
			}
		} catch (error) {
			console.error("Failed to delete", error);
		} finally {
			setDeleteTargetId(null);
		}
	};

	const formatTime = (isoString: string) => {
		const date = new Date(isoString);
		const h = date.getHours();
		const m = date.getMinutes().toString().padStart(2, "0");
		return `${h}時${m}分`;
	};

	const formatDuration = (seconds: number) => {
		const m = Math.round(seconds / 60);
		return `${m}分`;
	};

	// Find max duration to highlight
	const maxDuration = Math.max(
		...data.records.map((r) => r.durationSeconds),
		0,
	);

	return (
		<div className="min-h-screen bg-pink-50 max-w-md mx-auto">
			{/* Header */}
			<header className="relative flex items-center justify-center pt-8 pb-4 px-4">
				<h1 className="text-xl font-medium text-gray-700">今日の記録</h1>
			</header>

			<main className="max-w-md mx-auto px-6 flex flex-col items-center gap-6">
				{/* Character Card */}
				<div className="bg-white rounded-[2rem] p-6 w-full shadow-sm aspect-square flex flex-col items-center justify-center relative">
					<div className="text-center w-full h-full flex flex-col items-center justify-center">
						<p className="text-sm font-bold text-gray-800 mb-2">
							めっちゃ歩く人！
						</p>
						<div className="relative w-full flex-1 min-h-0 my-2">
							<Image
								src="/record-character.png"
								alt="Character"
								fill
								className="object-contain"
								priority
							/>
						</div>
						<p className="absolute top-16 right-8 text-2xl font-bold text-gray-800 transform rotate-12 z-10">
							めちゃ
							<br />
							歩くよ!
						</p>
						<div className="border border-red-400 rounded-md p-1 w-8 h-8 absolute bottom-20 right-10 transform -rotate-12 flex items-center justify-center z-10">
							<span className="text-red-400 text-xs font-bold">どう</span>
						</div>
					</div>
					<p className="text-sm font-bold text-gray-600 mt-2">目安：30分以上</p>
				</div>

				{/* Time Input / Scroll Picker */}
				<div className="bg-black text-white rounded-xl p-6 w-full flex justify-center items-end gap-6 shadow-lg">
					<TimeScrollPicker
						value={hours}
						onChange={setHours}
						max={24}
						unit="時間"
					/>
					<div className="h-[120px] flex items-center pb-6 text-2xl">:</div>
					<TimeScrollPicker
						value={minutes}
						onChange={setMinutes}
						max={60}
						unit="分"
					/>
					<div className="h-[120px] flex items-center pb-6 text-2xl">:</div>
					<TimeScrollPicker
						value={seconds}
						onChange={setSeconds}
						max={60}
						unit="秒"
					/>
				</div>

				{/* Record Button */}
				<button
					type="button"
					onClick={handleRecord}
					className="bg-cyan-400 text-white font-bold py-3 px-12 rounded-full w-full shadow-md active:scale-95 transition-transform"
				>
					記録する
				</button>

				{/* Record List */}
				<div className="w-full mt-4">
					<h2 className="text-center text-sm font-bold text-gray-700 mb-6">
						今日の運動記録
					</h2>
					<div className="relative pl-6 border-l-2 border-gray-200 ml-4 max-h-[300px] overflow-y-auto pr-2">
						{data.records.length === 0 ? (
							<p className="text-gray-400 text-sm py-4">
								今日の記録はまだありません
							</p>
						) : (
							<div className="space-y-8">
								{data.records.map((record) => {
									const isMax =
										maxDuration > 0 && record.durationSeconds === maxDuration;
									return (
										<div
											key={record.id}
											className="relative flex items-center justify-between"
										>
											<div
												className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white shadow-sm ${
													isMax
														? "bg-gradient-to-br from-pink-400 to-purple-500"
														: "bg-gray-400"
												}`}
											/>
											<span className="text-base font-bold text-gray-800 ml-2">
												{formatTime(record.startTime)} :
											</span>
											<span className="text-xl font-bold text-gray-800">
												{formatDuration(record.durationSeconds)}
											</span>
											<button
												type="button"
												onClick={() => handleDeleteRequest(record.id)}
												className="ml-4 p-1 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500 transition-colors"
											>
												<Minus size={14} />
											</button>
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Total Time */}
				<div className="flex items-center gap-2 mt-4 pb-8">
					<span className="text-lg font-bold text-gray-800">合計時間 :</span>
					<span className="text-3xl font-bold text-gray-800">
						{data.totalDuration}分
					</span>
					<Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
				</div>
			</main>

			<ConfirmModal
				isOpen={!!deleteTargetId}
				onClose={() => setDeleteTargetId(null)}
				onConfirm={handleDeleteConfirm}
				title="記録の削除"
				message="この運動記録を削除してもよろしいですか？"
				confirmText="削除する"
				cancelText="キャンセル"
			/>
			<BottomNav />
		</div>
	);
}
