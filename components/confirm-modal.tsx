"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
}

export function ConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "削除する",
	cancelText = "キャンセル",
}: ConfirmModalProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(isOpen);
	}, [isOpen]);

	if (!isOpen) return null;

	return createPortal(
		<div
			className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
				isVisible ? "bg-black/50 backdrop-blur-sm" : "bg-black/0 opacity-0"
			}`}
		>
			<div
				className={`w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl transition-all duration-300 transform ${
					isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
				}`}
			>
				<div className="p-6">
					<h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
					<p className="text-sm text-gray-500 mb-6 leading-relaxed">
						{message}
					</p>

					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors"
						>
							{cancelText}
						</button>
						<button
							type="button"
							onClick={() => {
								onConfirm();
								onClose();
							}}
							className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-sm"
						>
							{confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
