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
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		if (isOpen) {
			// Small delay to allow enter animation
			const timer = setTimeout(() => setShowContent(true), 100);
			return () => clearTimeout(timer);
		}
		// Reset when closed
		const timer = setTimeout(() => setShowContent(false), 0);
		return () => clearTimeout(timer);
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			{/* Backdrop */}
			<button
				type="button"
				className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-default w-full h-full border-none"
				onClick={onClose}
				onKeyDown={(e) => e.key === "Enter" && onClose()}
				aria-label="Close modal"
			/>

			{/* Modal Content */}
			<div
				className={`
				relative bg-[#FFFBEB] w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl
				transition-all duration-500 transform
				${showContent ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-10"}
			`}
			>
				{/* Close Button */}
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 left-4 p-2 text-slate-800 hover:bg-black/5 rounded-full transition-colors"
				>
					<X className="h-6 w-6" />
				</button>

				<div className="flex flex-col items-center justify-center py-4">
					{stamp && (
						<>
							<h2 className="text-lg font-bold text-slate-900 mb-8 whitespace-pre-line leading-relaxed">
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
						</>
					)}
				</div>
			</div>
		</div>
	);
}
