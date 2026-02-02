"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface DailyGoal {
	id: string;
	title: string;
	imageUrl: string | null;
	description: string | null;
	footer: string | null;
}

interface DailyGoalModalProps {
	goal: DailyGoal;
	onClose: () => void;
}

export function DailyGoalModal({ goal, onClose }: DailyGoalModalProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [imageError, setImageError] = useState(false);

	useEffect(() => {
		// Small delay for animation
		const timer = setTimeout(() => setIsVisible(true), 100);
		return () => clearTimeout(timer);
	}, []);

	const handleClose = () => {
		setIsVisible(false);
		setTimeout(onClose, 300); // Wait for animation
	};

	return createPortal(
		<div
			className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
				isVisible
					? "bg-black/50 backdrop-blur-sm"
					: "bg-black/0 backdrop-blur-none pointer-events-none"
			}`}
		>
			<div
				className={`relative w-full max-w-sm overflow-hidden rounded-3xl bg-[#FEF9E2] text-center shadow-2xl transition-all duration-300 border-4 border-[#FDF0C6] ${
					isVisible
						? "scale-100 opacity-100 translate-y-0"
						: "scale-95 opacity-0 translate-y-4"
				}`}
			>
				{/* Close Button */}
				<button
					type="button"
					onClick={handleClose}
					className="absolute left-4 top-4 rounded-full p-2 text-gray-500 hover:bg-black/5 transition-colors"
					aria-label="Close"
				>
					<X className="h-6 w-6" />
				</button>

				<div className="flex flex-col items-center px-6 pt-16 pb-12">
					<p className="text-sm font-bold text-gray-800 mb-6 tracking-wider">
						今日のあなたの人生は
					</p>

					<h2 className="text-3xl font-black text-black mb-6 tracking-wide leading-tight">
						{goal.title}
					</h2>

					<div className="relative mb-6 w-48 h-48 flex items-center justify-center">
						{!imageError && goal.imageUrl ? (
							<div className="w-full h-full relative group">
								<Image
									src={goal.imageUrl}
									alt={goal.title}
									fill
									className="object-contain drop-shadow-md transform group-hover:scale-105 transition-transform duration-300"
									onError={() => setImageError(true)}
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
									unoptimized
								/>
								{/* Hanko / Stamp decoration */}
								<div className="absolute bottom-2 right-2 border-2 border-red-500 rounded p-1 rotate-[-10deg] opacity-80 pointer-events-none">
									<span className="text-[10px] font-bold text-red-500 block leading-none">
										どう
										<br />
										なし
									</span>
								</div>
							</div>
						) : (
							<div className="text-9xl flex items-center justify-center">
								🏃
							</div>
						)}
					</div>

					<div className="space-y-4 w-full">
						{/* Time / Difficulty */}
						<div className="text-center">
							<p className="text-sm font-bold text-gray-600">
								目安：{goal.footer || "30分以上"}
							</p>
						</div>

						{/* Description */}
						<div className="text-center">
							<p className="font-bold text-black text-lg leading-relaxed">
								{goal.description}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
