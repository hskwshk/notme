"use client";

import { CalendarDays, Home, NotebookPen, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
	const pathname = usePathname();

	const navItems = [
		{ label: "友達", icon: UserPlus, href: "/friends/search" },
		{ label: "カレンダー", icon: CalendarDays, href: "/calendar" },
		{ label: "ホーム", icon: Home, href: "/" },
		{ label: "記録", icon: NotebookPen, href: "/record" },
		// Profile is handled specially as a circle
		{ label: "プロフィール", icon: null, href: "/profile" },
	];

	return (
		<div className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto">
			<div className="bg-[#1C1C1E] text-white rounded-full shadow-2xl px-6 py-4 flex justify-between items-center">
				{navItems.map((item) => {
					const isActive = pathname === item.href;

					if (item.label === "プロフィール") {
						return (
							<Link
								key={item.href}
								href={item.href}
								className="flex flex-col items-center gap-1"
							>
								<div
									className={`h-7 w-7 rounded-full ${isActive ? "bg-white" : "bg-gray-500"} transition-colors`}
								/>
								<span
									className={`text-[10px] font-medium ${isActive ? "text-white" : "text-gray-400"}`}
								>
									{item.label}
								</span>
							</Link>
						);
					}

					const Icon = item.icon;

					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex flex-col items-center gap-1 transition-colors ${
								isActive ? "text-white" : "text-gray-400"
							}`}
						>
							{Icon && (
								<Icon
									className={`${isActive ? "h-7 w-7" : "h-7 w-7"}`}
									// Fill home icon if active? The image shows outline mostly but bold.
									strokeWidth={2}
								/>
							)}
							<span
								className={`text-[10px] font-medium ${isActive ? "text-white" : "text-white"}`}
							>
								{item.label}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
