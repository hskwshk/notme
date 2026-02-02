// components/character-modal.tsx
"use client";

import Image from "next/image";
import type { Character } from "@/types/character";

type CharacterModalProps = {
	isOpen: boolean;
	onClose: () => void;
	character: Character | null;
};

export function CharacterModal({
	isOpen,
	onClose,
	character,
}: CharacterModalProps) {
	if (!isOpen || !character) return null;

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
					<div className="absolute top-[10px] left-[15px]">
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
						<p className="mb-2">今日のあなたの人生は</p>
						<h3 className="text-[32px] font-bold mb-4">{character.name}</h3>
						<Image
							src={character.image}
							alt={character.name}
							width={213}
							height={213}
							className="mb-4"
						/>
						<p className="mb-2">目安：{character.timeGuide}</p>
						<p>{character.description}</p>
					</div>
				</div>
			</div>
		</>
	);
}
