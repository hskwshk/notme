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
		<div className="bg-gradient-to-r from-sky-400 to-cyan-300 text-white rounded-[15px] px-3 py-2 shadow-md flex items-center justify-between relative overflow-visible mt-6">
			{/* Content */}
			<div className="flex-1 z-10 pr-4">
				<div className="flex items-baseline gap-2">
					<span className="font-bold opacity-90">Lv.{level}</span>
				</div>

				<div className="mb-1">
					<p className="text-[12px] opacity-90">
						レベルアップまで後
						<span className="font-bold mx-0.5 text-base">
							{progress.remaining}
						</span>
						ミッション
					</p>
				</div>

				<div className="h-3 w-full bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
					<div
						className="h-full bg-lime-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(163,230,53,0.5)]"
						style={{ width: `${percentage}%` }}
					/>
				</div>
			</div>

			{/* ガチャボタン */}
			<div className="z-10 flex-shrink-0 relative">
				<button
					type="button"
					onClick={onGachaClick}
					disabled={!isLevelUpReady}
					className={`
						group relative flex items-center justify-center size-[62px] rounded-full border-4 border-yellow-300
						transition-all duration-300
						${
							isLevelUpReady
								? "bg-yellow-500 hover:scale-105 animate-pulse cursor-pointer shadow-yellow-500/50"
								: "bg-yellow-500/50 cursor-not-allowed grayscale-[0.5]"
						}
					`}
				>
					{/* 報酬リング */}
					{isLevelUpReady && (
						<div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-75" />
					)}

					{/* 報酬アイコン */}
					<Gift
						className={`h-8 w-8 text-white ${isLevelUpReady ? "animate-bounce" : ""}`}
						strokeWidth={2.5}
					/>
				</button>
			</div>
		</div>
	);
}
