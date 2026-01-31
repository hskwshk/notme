// components/notice-card.tsx
// type ButtonProps = {
//   text: string;
//   onClick: () => void;
// };

// export function Button({ text, onClick }: ButtonProps) {
//   return (
//     <button
//       onClick={onClick}
//       className="bg-blue-500 text-white px-4 py-2 rounded"
//     >
//       {text}
//     </button>
//   );
// }
import Image from "next/image";

export function Card() {
	return (
		<div className="relative bg-white w-[353px] h-[125px] p-4 rounded-[30px] text-black">
			<div className="absolute top-[18px] right-[30px] bg-[#FEE123] w-[11px] h-[11px] rounded-full"></div>
			<div className="flex justify-center items-center">
				<div className="bg-[#999] min-w-[47px] min-h-[47px] mr-[25px]  rounded-[50px]">
					{/* <Image
            src="sample/sample_icon.svg"
            alt="アイコン画像"
            width={100}
            height={100}
          /> */}
				</div>
				<div>
					<h3 className="font-bold">テキストが入ります</h3>
					<p>
						テキストが入りますテキストが入りますテキストが入りますテキストが入ります
					</p>
				</div>
			</div>
		</div>
	);
}
