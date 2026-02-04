"use client";

import { ArrowLeft, Loader2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

// Types
type Stamp = {
	id: string;
	name: string;
	imageUrl: string;
	isFavorite: boolean;
	favoriteOrder: number | null;
};

export default function StampEditPage() {
	const router = useRouter();
	const [allStamps, setAllStamps] = useState<Stamp[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Local state for the 3 slots (null means empty)
	type SlotState = Stamp | null;
	const [slots, setSlots] = useState<[SlotState, SlotState, SlotState]>([
		null,
		null,
		null,
	]);

	// Modal State
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null); // 0, 1, 2
	const [currentPage, setCurrentPage] = useState(1);

	// Fetch Stamps
	useEffect(() => {
		const fetchStamps = async () => {
			try {
				const res = await apiClient.api.users.me.stamps.$get();
				if (!res.ok) throw new Error("Failed to fetch stamps");
				const data = await res.json();
				setAllStamps(data.stamps); // data.stamps is the array

				// Initialize slots from fetched data
				const initialSlots: [SlotState, SlotState, SlotState] = [
					null,
					null,
					null,
				];
				for (const s of data.stamps) {
					if (
						s.isFavorite &&
						s.favoriteOrder !== null &&
						s.favoriteOrder >= 1 &&
						s.favoriteOrder <= 3
					) {
						initialSlots[s.favoriteOrder - 1] = s;
					}
				}
				setSlots(initialSlots);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchStamps();
	}, []);

	const handleOpenModal = (index: number) => {
		setActiveSlotIndex(index);
		setIsModalOpen(true);
	};

	const handleSelectStamp = (stamp: Stamp) => {
		if (activeSlotIndex === null) return;

		// Check if already selected in another slot
		const existingIndex = slots.findIndex((s) => s?.id === stamp.id);
		if (existingIndex !== -1 && existingIndex !== activeSlotIndex) {
			// Swap or alert? Let's just remove from old slot for smoothness
			const newSlots = [...slots] as [SlotState, SlotState, SlotState];
			newSlots[existingIndex] = null;
			newSlots[activeSlotIndex] = stamp;
			setSlots(newSlots);
		} else {
			const newSlots = [...slots] as [SlotState, SlotState, SlotState];
			newSlots[activeSlotIndex] = stamp;
			setSlots(newSlots);
		}
		setIsModalOpen(false);
		setActiveSlotIndex(null);
	};

	const handleSave = async () => {
		if (isSaving) return;
		setIsSaving(true);
		try {
			// Filter out nulls and get IDs
			// The order in the array corresponds to rank 1, 2, 3
			// But the backend expects just a list of IDs.
			// Wait, the backend endpoint `PUT /me/profile/favorite-stamps` takes `stampIds: string []`.
			// And it assigns order based on the array index (0 -> rank 1, 1 -> rank 2).
			// So we need to construct the array carefully.
			// Currently slots is [Rank1, Rank2, Rank3].
			// If Rank 2 is null but Rank 3 is set, what happens?
			// The array passed to backend: ["id1", "id3"] -> id1 becomes rank 1, id3 becomes rank 2.
			// This might shuffle things if user wanted a gap.
			// BUT, the requirement is "Top 3". Gaps are weird for "Top 3".
			// Let's assume compacting is fine, OR we need to verify backend logic.
			// Looking at `server/routes/user.ts`:
			// for (let i = 0; i < stampIds.length; i++) { ... favoriteOrder: i + 1 }
			// So yes, it compacts.
			// If we want to strictly maintain the "Rank 1, Rank 2" visual, we must pass the IDs in order.
			// If slots[1] is null, we can't pass [slots[0].id, slots[2].id] because slot[2] would become rank 2.
			// So we basically should only send non-nulls and accept they will become Rank 1..N.
			// OR, we assume the UI enforces filling from top (or we just accept the shift).
			// Let's just send the non-null IDs.
			// biome-ignore lint/style/noNonNullAssertion: Filtered out nulls
			const stampIds = slots.filter((s) => s !== null).map((s) => s!.id);

			const res = await apiClient.api.users.me.profile["favorite-stamps"].$put({
				json: { stampIds },
			});

			if (!res.ok) {
				const errorData = await res.json();
				if ("error" in errorData) alert(errorData.error);
				else alert("Failed to save");
				return;
			}

			router.push("/profile");
			router.refresh();
		} catch (error) {
			console.error(error);
			alert("An error occurred");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-screen bg-[#F4F4F5]">
				<Loader2 className="w-8 h-8 animate-spin text-gray-500" />
			</div>
		);
	}

	return (
		<main className="min-h-screen bg-[#FEF2F2] pb-6 relative font-[family-name:var(--font-geist-sans)]">
			{/* Header */}
			<header className="fixed top-0 left-0 right-0 z-10 flex h-[60px] items-center justify-between bg-[#FDFDFC] px-4">
				<Link
					href="/profile"
					className="flex h-10 w-10 items-center justify-center p-2"
				>
					<ArrowLeft className="h-6 w-6 text-gray-700" />
				</Link>
				<h1 className="text-lg font-bold text-gray-900">
					お気に入りスタンプTOP3
				</h1>
				<div className="w-10" />
			</header>

			<div className="pt-[80px] px-6">
				<p className="text-center text-xs text-gray-500 mb-6 font-bold">
					お気に入りスタンプを3つ選んでください
				</p>

				{/* Slots Card */}
				<div className="bg-white rounded-[32px] p-6 shadow-sm mb-6 space-y-4">
					{slots.map((slot, index) => {
						const rank = index + 1;
						// Badge colors
						const badgeColor =
							rank === 1
								? "bg-[#E6CB78]" // Gold-ish
								: rank === 2
									? "bg-[#A6A6A6]" // Silver
									: "bg-[#C49A7A]"; // Bronze
						// Border styles for the stamp box
						const borderStyle = "border-2 border-dashed border-gray-200";

						return (
							<div
								key={rank}
								className="flex items-center justify-between bg-[#FFFDE7]/50 rounded-2xl p-4 border border-[#FFF9C4]" // Light yellow bg like mock
							>
								{/* Left: Rank & Preview */}
								<div className="flex items-center gap-4 relative">
									{/* Rank Badge */}
									<div
										className={`absolute -top-6 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shadow-sm border border-white ${badgeColor}`}
									>
										{rank}位
									</div>

									{/* Stamp Box */}
									<div
										className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center ${borderStyle} ml-4`}
									>
										{slot ? (
											<div className="relative w-12 h-12">
												<Image
													src={slot.imageUrl}
													alt={slot.name}
													fill
													className="object-contain"
													unoptimized
												/>
											</div>
										) : (
											<Star className="w-8 h-8 text-gray-200 fill-gray-200" />
										)}
									</div>
								</div>

								{/* Right: Change Button */}
								<button
									type="button"
									onClick={() => handleOpenModal(index)}
									className="bg-[#8AB8FF] text-white text-xs font-bold px-6 py-2 rounded-full hover:bg-blue-400 transition-colors shadow-sm"
								>
									変更
								</button>
							</div>
						);
					})}
				</div>

				{/* Preview Section */}
				<div className="bg-[#FFFDE7] rounded-[32px] p-6 shadow-sm border border-[#FFF9C4]">
					<h3 className="text-center text-sm font-bold text-gray-800 mb-8">
						私の好きなスタンプランキング
					</h3>

					<div className="flex items-end justify-center gap-2 mb-4">
						{/* 2nd Place */}
						<div className="flex flex-col items-center w-1/3">
							<span className="bg-[#A6A6A6] text-white text-[10px] font-bold px-3 py-0.5 rounded-full mb-2">
								2位
							</span>
							<div
								className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center border-2 border-dashed border-gray-200 mb-2 shadow-sm`}
							>
								{slots[1] ? (
									<div className="relative w-12 h-12">
										<Image
											src={slots[1].imageUrl}
											alt="2nd"
											fill
											className="object-contain"
											unoptimized
										/>
									</div>
								) : (
									<Star className="w-8 h-8 text-gray-200 fill-gray-200" />
								)}
							</div>
							{/* Podium */}
							<div className="h-10 w-full bg-gradient-to-br from-[#D9D9D9] to-[#BDBDBD] rounded-lg shadow-inner" />
						</div>

						{/* 1st Place */}
						<div className="flex flex-col items-center w-1/3 z-10">
							<span className="bg-[#E6CB78] text-white text-[10px] font-bold px-3 py-0.5 rounded-full mb-2">
								1位
							</span>
							<div
								className={`w-20 h-20 rounded-2xl bg-white flex items-center justify-center border-2 border-dashed border-gray-200 mb-2 shadow-md`}
							>
								{slots[0] ? (
									<div className="relative w-16 h-16">
										<Image
											src={slots[0].imageUrl}
											alt="1st"
											fill
											className="object-contain"
											unoptimized
										/>
									</div>
								) : (
									<Star className="w-10 h-10 text-[#E6CB78] fill-[#E6CB78] opacity-50" />
								)}
							</div>
							{/* Podium */}
							<div className="h-16 w-full bg-gradient-to-br from-[#F5E08E] to-[#D4B351] rounded-lg shadow-lg" />
						</div>

						{/* 3rd Place */}
						<div className="flex flex-col items-center w-1/3">
							<span className="bg-[#C49A7A] text-white text-[10px] font-bold px-3 py-0.5 rounded-full mb-2">
								3位
							</span>
							<div
								className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center border-2 border-dashed border-gray-200 mb-2 shadow-sm`}
							>
								{slots[2] ? (
									<div className="relative w-12 h-12">
										<Image
											src={slots[2].imageUrl}
											alt="3rd"
											fill
											className="object-contain"
											unoptimized
										/>
									</div>
								) : (
									<Star className="w-8 h-8 text-gray-200 fill-gray-200" />
								)}
							</div>
							{/* Podium */}
							<div className="h-8 w-full bg-gradient-to-br from-[#E0BFA3] to-[#B08D74] rounded-lg shadow-inner" />
						</div>
					</div>
				</div>

				{/* Save Button */}
				<div className="mt-8 text-center pb-8">
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving}
						className="w-[240px] bg-[#8AB8FF] text-white text-base font-bold py-4 rounded-full shadow-lg hover:bg-blue-400 transition-colors disabled:opacity-70"
					>
						{isSaving ? "保存中..." : "保存"}
					</button>
				</div>
			</div>

			{/* Stamp Picker Modal */}
			{/* Stamp Picker Modal (Bottom Sheet) */}
			{isModalOpen && (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop */}
					{/* biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop */}
					<div
						className="absolute inset-0 z-0"
						onClick={() => setIsModalOpen(false)}
					/>

					<div className="bg-[#FFFDF5] rounded-t-[30px] w-full max-w-md h-[70vh] flex flex-col overflow-hidden relative z-10 animate-in slide-in-from-bottom duration-300 pb-10">
						{/* Handle bar */}
						<div className="w-full flex justify-center pt-3 pb-1">
							<div className="w-10 h-1 bg-gray-300 rounded-full" />
						</div>

						{/* Modal Header */}
						<div className="text-center pt-2 pb-4">
							<h3 className="text-lg font-bold text-gray-900">
								スタンプを選択
							</h3>
							<p className="text-xs text-gray-500 font-bold">
								タップで追加・入れ替え
							</p>
						</div>

						{/* Grid Container */}
						<div className="px-6 pb-6 flex-1 overflow-hidden">
							<div className="bg-[#FFF9C4]/30 rounded-[20px] p-4 h-full flex flex-col justify-between overflow-y-auto">
								<div className="grid grid-cols-3 gap-3">
									{allStamps
										.slice((currentPage - 1) * 9, currentPage * 9)
										.map((stamp) => (
											// biome-ignore lint/a11y/useKeyWithClickEvents: simple selection
											// biome-ignore lint/a11y/noStaticElementInteractions: simple selection
											<div
												key={stamp.id}
												className="aspect-square bg-white rounded-xl flex items-center justify-center border border-[#E6E6E6] relative shadow-sm"
												onClick={() => handleSelectStamp(stamp)}
											>
												<div className="relative w-[80%] h-[80%]">
													<Image
														src={stamp.imageUrl}
														alt={stamp.name}
														fill
														className="object-contain"
														unoptimized
													/>
												</div>
												{/* Selected Indicator */}
												{slots.some((s) => s?.id === stamp.id) && (
													<div className="absolute bottom-1 right-1 text-[10px] font-bold text-red-400 bg-white/80 px-1 rounded">
														済
													</div>
												)}
											</div>
										))}
									{/* Fill empty slots to keep grid shape if needed, or just let it flow */}
									{allStamps.length === 0 && (
										<div className="col-span-3 text-center text-gray-500 py-10 text-xs font-bold">
											スタンプを持っていません
										</div>
									)}
								</div>

								{/* Pagination */}
								{allStamps.length > 9 && (
									<div className="flex items-center justify-center gap-2 mt-4">
										<button
											type="button"
											onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
											disabled={currentPage === 1}
											className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 disabled:opacity-30 hover:bg-black/5"
										>
											<span className="text-lg font-bold">‹</span>
										</button>

										<div className="flex items-center gap-1">
											{Array.from(
												{ length: Math.ceil(allStamps.length / 9) },
												(_, i) => i + 1,
											).map((page) => {
												// Show limited pages logic if needed, but for now simple list
												if (
													page === 1 ||
													page === Math.ceil(allStamps.length / 9) ||
													(page >= currentPage - 1 && page <= currentPage + 1)
												) {
													return (
														<button
															key={page}
															type="button"
															onClick={() => setCurrentPage(page)}
															className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
																currentPage === page
																	? "bg-[#8AB8FF] text-white"
																	: "bg-white text-gray-600 border border-gray-200"
															}`}
														>
															{page}
														</button>
													);
												}
												if (
													page === currentPage - 2 ||
													page === currentPage + 2
												) {
													return (
														<span key={page} className="text-gray-400 text-xs">
															...
														</span>
													);
												}
												return null;
											})}
										</div>

										<button
											type="button"
											onClick={() =>
												setCurrentPage((p) =>
													Math.min(Math.ceil(allStamps.length / 9), p + 1),
												)
											}
											disabled={currentPage === Math.ceil(allStamps.length / 9)}
											className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 disabled:opacity-30 hover:bg-black/5"
										>
											<span className="text-lg font-bold">›</span>
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
