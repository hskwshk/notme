"use client";

import { Bell } from "lucide-react";

interface HomeHeaderProps {
	hasUnreadNotifications: boolean;
}

export function HomeHeader({ hasUnreadNotifications }: HomeHeaderProps) {
	return (
		// <header className="flex justify-end p-4">
		// 	<div className="relative">
		// 		<Bell className="h-6 w-6 text-gray-900" />
		// 		{hasUnreadNotifications && (
		// 			<span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
		// 		)}
		// 	</div>
		// </header>

		<header className="flex items-center justify-between h-[100px] px-4 text-[#676767]">
			{/* 左側スペース確保（中央揃えのため） */}
			<div className="w-10"></div>
			<h1 className="text-[24px] text-center flex-1">ホーム</h1>
			<div className="w-[40px] h-[40px]">
				<Bell className="size-full text-gray-900" />
				{hasUnreadNotifications && <span className="" />}
			</div>
		</header>
	);
}
