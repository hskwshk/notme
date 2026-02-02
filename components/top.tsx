"use client";

import { useRouter } from "next/navigation";

type TopProps = {
	name: string; // ページ名
	backType?: "home" | "previous" | "none"; // 戻るボタン機能の条件分岐
};

export function Top({ name, backType = "home" }: TopProps) {
	const router = useRouter();

	const handleBack = () => {
		if (backType === "home") {
			router.push("/");
		} else if (backType === "previous") {
			router.back();
		}
	};

	return (
		<header className="flex items-center justify-between h-[100px] px-4 text-[#676767]">
			<div className="w-10">
				{backType !== "none" && (
					<button
						type="button"
						onClick={handleBack}
						className="text-2xl w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition"
						aria-label="戻る"
					>
						＜
					</button> // < は仮置き、余裕あればちゃんと作る
				)}
			</div>

			<h1 className="text-xl font-bold text-center flex-1">{name}</h1>

			{/* 右側スペース確保（中央揃えのため） */}
			<div className="w-10"></div>
		</header>
	);
}
