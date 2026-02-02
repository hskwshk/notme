// data/characters.ts
import type { Character } from "@/types/character";

export const characters: Character[] = [
	// キャラクターパターン
	{
		id: 1,
		name: "めっちゃ歩く人！",
		image: "/sample/sticker_walk.svg",
		timeGuide: "30分以上",
		description: "とにかくいっぱい歩く人！！！",
	},
	{
		id: 2,
		name: "ゆっくり散歩人",
		image: "/sample/sticker_walked.svg",
		timeGuide: "15分程度",
		description: "のんびりゆったり歩くタイプ",
	},
	{
		id: 3,
		name: "超高速ランナー",
		image: "/sample/sticker_run.svg",
		timeGuide: "45分以上",
		description: "走りまくる元気な人！",
	},
	{
		id: 4,
		name: "お家でゆったり人",
		image: "/sample/sticker_sleep.svg",
		timeGuide: "5分未満",
		description: "お家でリラックスするのが好き",
	},
	{
		id: 5,
		name: "バランス良い人",
		image: "/sample/sticker_stretch.svg",
		timeGuide: "20分程度",
		description: "ちょうど良いペースで動く人",
	},
];
