"use client";

import type { ReactNode } from "react";

type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
};

export function Modal({ isOpen, onClose, children }: ModalProps) {
	if (!isOpen) return null;

	return (
		<>
			{/* 背景オーバーレイ */}
			<button
				type="button"
				className="fixed inset-0 bg-black/70 z-40"
				onClick={onClose}
				aria-label="モーダルを閉じる"
			/>

			{/* モーダル本体 */}
			<div
				className="fixed top-[110px] left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-10"
				role="dialog"
				aria-modal="true"
			>
				<div className="relative bg-[#FFFDD0] rounded-xl max-w-md w-full shadow-xl">
					<div className="absolute p-6">
						<button
							type="button"
							onClick={onClose}
							className="text-black text-4xl"
							aria-label="閉じる"
						>
							×
						</button>
					</div>

					{/* コンテンツ */}
					<div className="flex flex-col items-center py-[50px] text-center">
						{children}
					</div>
				</div>
			</div>
		</>
	);
}
