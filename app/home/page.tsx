"use client";

import Image from "next/image";
import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Modal } from "@/components/character-modal";

export default function Home() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<main className="my-[70px]">
			<header className="h-[100px] px-4 text-[#676767]">
				<h1 className="text-[24px] text-center flex-1">ホーム</h1>
			</header>

			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="bg-blue-500 text-white px-4 py-2 rounded"
			>
				モーダルを開く
			</button>

			<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
				<p className="mb-2">今日のあなたの人生は</p>
				<h3 className="text-[32px] font-bold">めっちゃ歩く人！</h3>
				<Image
					src="sample/walk_sticker.svg"
					alt="sample_icon"
					width={213}
					height={213}
				/>
				<p>目安：30分以上</p>
				<p>とにかくいっぱい歩く人！！！</p>
			</Modal>

			<BottomNav />
		</main>
	);
}
