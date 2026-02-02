"use client";

import { useEffect, useRef, useState } from "react";

interface TimeScrollPickerProps {
	value: number;
	onChange: (value: number) => void;
	max: number;
	unit: string;
}

export function TimeScrollPicker({
	value,
	onChange,
	max,
	unit,
}: TimeScrollPickerProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [isScrolling, setIsScrolling] = useState(false);
	const itemHeight = 40; // Height of each item in pixels

	// Scroll to initial value on mount
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = value * itemHeight;
		}
	}, [value]);

	const handleScroll = () => {
		if (!scrollRef.current) return;
		setIsScrolling(true);

		// Clear timeout if exists to debounce snap
		if (
			(window as unknown as { scrollTimeout: NodeJS.Timeout }).scrollTimeout
		) {
			clearTimeout(
				(window as unknown as { scrollTimeout: NodeJS.Timeout }).scrollTimeout,
			);
		}

		(window as unknown as { scrollTimeout: NodeJS.Timeout }).scrollTimeout =
			setTimeout(() => {
				setIsScrolling(false);
				if (scrollRef.current) {
					const scrollTop = scrollRef.current.scrollTop;
					const index = Math.round(scrollTop / itemHeight);
					const clampedIndex = Math.max(0, Math.min(index, max - 1));

					// Snap visually
					scrollRef.current.scrollTo({
						top: clampedIndex * itemHeight,
						behavior: "smooth",
					});

					if (clampedIndex !== value) {
						onChange(clampedIndex);
					}
				}
			}, 100);
	};

	return (
		<div className="flex flex-col items-center">
			<div className="relative h-[120px] w-16 overflow-hidden">
				{/* Selection Highlight */}
				<div className="absolute top-[40px] left-0 right-0 h-[40px] pointer-events-none z-0" />

				<div
					ref={scrollRef}
					onScroll={handleScroll}
					className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
					style={{ scrollBehavior: isScrolling ? "auto" : "smooth" }}
				>
					{/* Padding top to center first item */}
					<div style={{ height: itemHeight }} />

					{[...Array(max)].map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: Static list
							key={i}
							className={`h-[40px] flex items-center justify-center snap-center transition-colors ${
								i === value
									? "text-white font-bold text-xl"
									: "text-gray-500 text-lg"
							}`}
						>
							{i}
						</div>
					))}

					{/* Padding bottom to center last item */}
					<div style={{ height: itemHeight }} />
				</div>
			</div>
			<span className="text-xs text-gray-400 mt-1">{unit}</span>
		</div>
	);
}
