"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface FollowRequestItemProps {
	username: string;
	count: number;
	image?: string;
}

export function FollowRequestItem({
	username,
	count,
	image,
}: FollowRequestItemProps) {
	return (
		<Link
			href="/friends/requests"
			className="flex items-center gap-4 p-4 bg-transparent mb-6 transition-opacity hover:opacity-70"
		>
			{/* Avatar */}
			<div className="size-14 rounded-full bg-gradient-to-tr from-pink-300 to-rose-400 p-[2px]">
				<div className="size-full rounded-full bg-slate-400 overflow-hidden border-2 border-white">
					{image ? (
						<img src={image} alt="" className="size-full object-cover" />
					) : (
						<div className="size-full bg-slate-400" />
					)}
				</div>
			</div>

			{/* Text */}
			<div className="flex-1">
				<p className="text-base font-bold text-slate-800 leading-snug">
					{username}、他{count > 1 ? `${count - 1}名` : ""}があなたを
					<br />
					フォローしました。
				</p>
			</div>

			{/* Arrow */}
			<ChevronRight className="size-6 text-slate-400" />
		</Link>
	);
}
