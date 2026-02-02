type CardProps = {
	title: string;
	description: string;
	isUnread?: boolean; // 未読フラグ
};

export function Card({ title, description, isUnread = false }: CardProps) {
	return (
		<div className="relative flex items-center bg-white w-[353px] h-[125px] p-4 mb-[40px] rounded-[30px] text-black">
			{/* 未読バッジ（isUnreadがtrueの時だけ表示）*/}
			{isUnread && (
				<div className="absolute top-[18px] right-[30px] bg-[#FEE123] w-[11px] h-[11px] rounded-full"></div>
			)}

			<div className="px-[10px] py-[5px]">
				<h3 className="font-bold">{title}</h3>
				<p>{description}</p>
			</div>
		</div>
	);
}
