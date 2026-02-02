"use client";

import { BottomNav } from "@/components/bottom-nav";

export default function Home() {
	return (
		<main className="my-[70px]">
			<header className="h-[100px] px-4 text-[#676767]">
				<h1 className="text-[24px] text-center flex-1">ホーム</h1>
			</header>

			<BottomNav />
		</main>
	);
}
