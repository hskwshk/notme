// app/notice/page.tsx
"use client";

import Image from "next/image";
import { Card } from "@/components/notice-card";

export default function Notice() {
	// const handleClick = () => {
	//   alert('クリックされました！');
	// };

	return (
		<main>
			<h1 className="text-xl font-bold">通知</h1>
			<h2 className="font-bold">2月2日</h2>
			<Card />
		</main>
	);
}
