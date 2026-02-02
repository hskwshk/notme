// app/home/page.tsx
"use client";

import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { CharacterModal } from "@/components/character-modal";
import { characters } from "@/data/characters";

export default function Home() {
	const [isOpen, setIsOpen] = useState(true); // テスト用true

	// ランダムにキャラクターを選択
	const [selectedCharacter] = useState(() => {
		const randomIndex = Math.floor(Math.random() * characters.length);
		return characters[randomIndex];
	});

	return (
		<main className="my-[70px]">
			<header className="h-[100px] px-4 text-[#676767]">
				<h1 className="text-[24px] text-center flex-1">ホーム</h1>
			</header>

			<CharacterModal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				character={selectedCharacter}
			/>

			<BottomNav />
		</main>
	);
}
