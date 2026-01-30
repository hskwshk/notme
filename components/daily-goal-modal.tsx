"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

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

	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
				isVisible
					? "bg-black/50 backdrop-blur-sm"
					: "bg-black/0 backdrop-blur-none pointer-events-none"
			}`}
		>
			<div
				className={`relative w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl transition-all duration-300 ${
					isVisible
						? "scale-100 opacity-100 translate-y-0"
						: "scale-95 opacity-0 translate-y-4"
				}`}
			>
				{/* Close Button */}
				<button
					type="button"
					onClick={handleClose}
					className="absolute left-4 top-4 rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
					aria-label="Close"
				>
					<X className="h-6 w-6" />
				</button>

				<div className="flex flex-col items-center px-6 pt-16 pb-12">
					<p className="text-sm font-medium text-gray-500 mb-2">
						今日のあなたの人生は
					</p>

					<h2 className="text-3xl font-black text-gray-900 mb-8 tracking-wide">
						{goal.title}
					</h2>

					<div className="relative mb-8 w-48 h-48 flex items-center justify-center">
						{!imageError && goal.imageUrl ? (
							<div className="w-full h-full relative">
								<img
									src={goal.imageUrl}
									alt={goal.title}
									className="object-contain w-full h-full"
									onError={() => setImageError(true)}
								/>
							</div>
						) : (
							<div className="text-9xl flex items-center justify-center">
								🏃
							</div>
						)}
					</div>

					<div className="space-y-1">
						<p className="font-bold text-gray-800">{goal.description}</p>
						<p className="text-sm text-gray-500">{goal.footer}</p>
					</div>
				</div>

				{/* Decorative stamp effect could go here */}
			</div>
		</div>
	);
}
