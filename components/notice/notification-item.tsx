"use client";

import { Circle } from "lucide-react";

interface NotificationItemProps {
	title: string;
	description: string;
	isRead: boolean;
	image?: string;
}

export function NotificationItem({
	title,
	description,
	isRead,
	image,
}: NotificationItemProps) {
	return (
		<div className="relative flex items-start gap-4 p-5 bg-white rounded-[32px] mb-4 shadow-sm border border-slate-50">
			{/* User Icon / Placeholder */}
			<div className="size-12 rounded-full bg-slate-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
				{image ? (
					<img src={image} alt="" className="size-full object-cover" />
				) : (
					<div className="size-full bg-slate-400" />
				)}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0 pr-4">
				<h3 className="text-base font-bold text-slate-900 leading-tight mb-1 truncate">
					{title}
				</h3>
				<p className="text-sm text-slate-500 leading-relaxed font-medium">
					{description}
				</p>
			</div>

			{/* Unread Indicator */}
			{!isRead && (
				<div className="absolute top-4 right-6">
					<div className="size-3 bg-yellow-300 rounded-full" />
				</div>
			)}
		</div>
	);
}
