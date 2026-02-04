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
		<header className="flex items-center justify-between h-[60px] px-4 mb-[30px] text-[#676767]">
			<div className="size-[30px]">
				{backType !== "none" && (
					<button
						type="button"
						onClick={handleBack}
						className="flex items-center justify-center size-full"
						aria-label="戻る"
					>
						＜
					</button> // < は仮置き、余裕あればちゃんと作る
				)}
			</div>

			<h1 className="text-[24px] text-center flex-1">{name}</h1>

			{/* 右側スペース確保（中央揃えのため） */}
			<div className="w-[30px]"></div>
		</header>
	);
}
