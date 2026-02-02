// components/stamp-modal.tsx
"use client";

import Image from "next/image";
import type { Stamp } from "@/types/character";

type StampModalProps = {
	isOpen: boolean;
	onClose: () => void;
	stamp: Stamp | null;
};

export function StampModal({ isOpen, onClose, stamp }: StampModalProps) {
	if (!isOpen || !stamp) return null;

	return (
		<>
			{/* 背景オーバーレイ */}
			<button
				type="button"
				className="fixed inset-0 bg-black/70 z-40"
				onClick={onClose}
				aria-label="モーダルを閉じる"
			/>

			{/* モーダル本体 */}
			<div
				className="fixed top-[110px] left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-10"
				role="dialog"
				aria-modal="true"
			>
				<div className="relative bg-[#FFFDD0] rounded-xl shadow-xl">
					{/* 閉じるボタン */}
					<div className="absolute top-6 right-6">
						<button
							type="button"
							onClick={onClose}
							className="text-black text-4xl hover:text-gray-700 transition"
							aria-label="閉じる"
						>
							×
						</button>
					</div>

					{/* コンテンツ */}
					<div className="flex flex-col items-center py-[50px] px-6 text-center">
						<h3 className="text-xl font-bold mb-2">
							『{stamp.stampName}』スタンプ
						</h3>
						<p className="text-2xl font-bold mb-4">GET!!!</p>
						<Image
							src={stamp.image}
							alt={`${stamp.stampName}スタンプ`}
							width={213}
							height={213}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
