// スタンプモーダルテスト用
"use client";

import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { StampModal } from "@/components/stamp-modal";
import { stamps } from "@/data/stamps";
import type { Stamp } from "@/types/character";

export default function Achievements() {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);

	const handleStampGet = (stamp: Stamp) => {
		setSelectedStamp(stamp);
		setIsOpen(true);
	};

	return (
		<main className="my-[70px]">
			<header className="h-[100px] px-4 text-[#676767]">
				<h1 className="text-[24px] text-center flex-1">実績</h1>
			</header>

			{/* スタンプ一覧 */}
			<div className="p-4 grid grid-cols-2 gap-4">
				{stamps.map((stamp) => (
					<button
						key={stamp.id}
						type="button"
						onClick={() => handleStampGet(stamp)}
						className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
					>
						<p className="text-sm font-bold">{stamp.stampName}</p>
					</button>
				))}
			</div>

			<StampModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				stamp={selectedStamp}
			/>

			<BottomNav />
		</main>
	);
}
