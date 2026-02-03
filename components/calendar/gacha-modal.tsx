import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Note: Using standard CSS/Tailwind for animations instead of framer-motion to reduce dependencies.

interface GachaModalProps {
	isOpen: boolean;
	onClose: () => void;
	stamp: {
		name: string;
		imageUrl: string;
	} | null;
}

export function GachaModal({ isOpen, onClose, stamp }: GachaModalProps) {
	const [stage, setStage] = useState<"hidden" | "opening" | "revealed">(
		"hidden",
	);

	useEffect(() => {
		if (isOpen) {
			const startTimer = setTimeout(() => setStage("opening"), 0);
			// "Tame" time (e.g., 2 seconds of shaking/loading)
			const revealTimer = setTimeout(() => {
				setStage("revealed");
			}, 2000);
			return () => {
				clearTimeout(startTimer);
				clearTimeout(revealTimer);
			};
		}
		const timer = setTimeout(() => setStage("hidden"), 0);
		return () => clearTimeout(timer);
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-default"
				onClick={stage === "revealed" ? onClose : undefined}
				onKeyDown={(e) => {
					if ((e.key === "Enter" || e.key === " ") && stage === "revealed") {
						onClose();
					}
				}}
			/>

			{/* Modal Content */}
			<div
				className={`
				relative bg-[#FFFBEB] w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl
				transition-all duration-500 transform
				${stage === "opening" ? "scale-90 opacity-100" : "scale-100 opacity-100"}
			`}
			>
				{/* Close Button (only after reveal) */}
				{stage === "revealed" && (
					<button
						type="button"
						onClick={onClose}
						className="absolute top-4 left-4 p-2 text-slate-800 hover:bg-black/5 rounded-full transition-colors"
					>
						<X className="h-6 w-6" />
					</button>
				)}

				<div className="min-h-[300px] flex flex-col items-center justify-center">
					{stage === "opening" && (
						<div className="animate-bounce">
							<div className="text-6xl mb-4 animate-spin-slow">📦</div>
							<p className="text-xl font-bold text-slate-700 animate-pulse">
								ガチャ中...
							</p>
						</div>
					)}

					{stage === "revealed" && stamp && (
						<div className="animate-in fade-in zoom-in duration-500">
							<h2 className="text-lg font-bold text-slate-900 mb-6">
								『{stamp.name}』 スタンプ
								<br />
								GET!!!
							</h2>

							<div className="relative w-48 h-48 mx-auto mb-6">
								{/* Placeholder for stamp image */}
								{}
								<Image
									src={stamp.imageUrl}
									alt={stamp.name}
									fill
									className="object-contain drop-shadow-lg"
									unoptimized
								/>
							</div>

							{/* Stamp mark decoration */}
							<div className="absolute bottom-10 right-10 rotate-12 opacity-80">
								<div className="border-4 border-red-500 text-red-500 font-bold text-xs p-1 rounded-sm">
									済
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
