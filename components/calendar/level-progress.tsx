import { Gift } from "lucide-react";

interface LevelProgressProps {
	level: number;
	progress: {
		current: number;
		required: number;
		remaining: number;
	};
	isLevelUpReady: boolean;
	onGachaClick: () => void;
}

export function LevelProgress({
	level,
	progress,
	isLevelUpReady,
	onGachaClick,
}: LevelProgressProps) {
	// Calculate percentage for progress bar
	const percentage = Math.min(
		100,
		Math.max(0, (progress.current / progress.required) * 100),
	);

	return (
		<div className="bg-[#1C1C1E] text-white rounded-2xl p-4 shadow-lg flex items-center justify-between relative overflow-hidden">
			{/* Background/Overlay logic can go here if needed */}

			<div className="flex-1 z-10">
				<div className="flex items-baseline gap-2 mb-1">
					<span className="text-sm text-blue-400 font-bold">Lv.{level}</span>
				</div>

				<div className="mb-2">
					<p className="text-xs text-slate-400">
						レベルアップまで後
						<span className="text-white font-bold mx-1">
							{progress.remaining}
						</span>
						ミッション
					</p>
				</div>

				<div className="h-3 w-full bg-slate-700 rounded-full overflow-hidden">
					<div
						className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 ease-out"
						style={{ width: `${percentage}%` }}
					/>
				</div>
			</div>

			<div className="ml-4 z-10">
				<button
					type="button"
					onClick={onGachaClick}
					disabled={!isLevelUpReady}
					className={`
						relative flex items-center justify-center h-12 w-12 rounded-full 
						transition-all duration-300
						${
							isLevelUpReady
								? "bg-yellow-500 hover:scale-105 animate-pulse cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.6)]"
								: "bg-slate-700 opacity-50 cursor-not-allowed grayscale"
						}
					`}
				>
					<Gift
						className={`h-6 w-6 ${isLevelUpReady ? "text-white" : "text-slate-400"}`}
					/>
				</button>
			</div>

			{/* Decorative background glow for chest area */}
			{isLevelUpReady && (
				<div className="absolute right-2 top-1/2 -translate-y-1/2 h-20 w-20 bg-yellow-500/10 blur-xl rounded-full" />
			)}
		</div>
	);
}
