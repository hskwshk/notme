"use client";

import { MoreHorizontal } from "lucide-react";
import Image from "next/image";

interface UserSectionProps {
	name: string;
	characterName: string | null;
	imageUrl: string | null;
}

export function UserSection({
	name,
	characterName,
	imageUrl,
}: UserSectionProps) {
	return (
		<div className="flex items-center justify-between px-4 py-2">
			<div className="flex items-center gap-3">
				{/* Avatar Placeholder */}
				<div className="h-12 w-12 rounded-full bg-gray-300 overflow-hidden">
					{imageUrl && (
						<div className="relative h-full w-full">
							<Image
								src={imageUrl}
								alt={name}
								className="object-cover"
								fill
								sizes="48px"
							/>
						</div>
					)}
				</div>
				<div>
					<h2 className="text-sm font-bold text-gray-900">{name}</h2>
					<p className="text-xs text-gray-500">
						{characterName || "なりきったキャラ"}
					</p>
				</div>
			</div>
			<button type="button" className="text-gray-500">
				<MoreHorizontal className="h-6 w-6" />
			</button>
		</div>
	);
}
