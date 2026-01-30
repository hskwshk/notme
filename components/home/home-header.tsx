"use client";

import { Bell } from "lucide-react";

interface HomeHeaderProps {
	hasUnreadNotifications: boolean;
}

export function HomeHeader({ hasUnreadNotifications }: HomeHeaderProps) {
	return (
		<div className="flex justify-end p-4">
			<div className="relative">
				<Bell className="h-6 w-6 text-gray-900" />
				{hasUnreadNotifications && (
					<span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
				)}
			</div>
		</div>
	);
}
