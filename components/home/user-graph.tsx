"use client";

interface GraphPoint {
	label: string;
	minutes: number;
}

interface UserGraphProps {
	graphData: GraphPoint[];
	scaleMax: number;
	isPrimary?: boolean;
}

export function UserGraph({
	graphData,
	scaleMax,
	isPrimary = false,
}: UserGraphProps) {
	// Y-axis scale max (monthly max)
	// Use Math.max(scaleMax, 1) to avoid division by zero
	const effectiveMax = Math.max(scaleMax, 1);

	return (
		<div className="flex-1 flex flex-col justify-end relative h-[120px] w-full">
			{/* Y-axis line (max value) */}
			<div className="absolute top-0 left-0 w-full border-t border-white/30 text-[10px] text-white/70">
				<span className="absolute -top-4 left-0">{effectiveMax}min</span>
			</div>

			<div className="flex items-end justify-between h-full gap-1">
				{graphData.map((point, i) => {
					const heightPercent = Math.min(
						(point.minutes / effectiveMax) * 100,
						100,
					);
					const isToday = i === graphData.length - 1;

					return (
						<div
							key={`${point.label}-${i}`}
							className="flex flex-col items-center justify-end h-full flex-1 gap-1"
						>
							<div className="w-full h-full flex items-end justify-center relative group">
								<div
									className={`w-3 sm:w-4 rounded-t-sm transition-all duration-500 ${
										isToday ? "bg-yellow-300" : "bg-white/50"
									} ${point.minutes === 0 ? "opacity-20" : "opacity-100"}`}
									style={{
										height: `${heightPercent}%`,
										minHeight: point.minutes > 0 ? "2px" : "0px",
									}}
								/>
								{/* Tooltip for minutes */}
								{point.minutes > 0 && (
									<div className="absolute -top-6 text-[10px] font-bold bg-black/50 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
										{point.minutes}分
									</div>
								)}
							</div>
							<span className="text-[8px] sm:text-[9px] opacity-80 whitespace-nowrap overflow-visible text-center leading-tight">
								{point.label}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
