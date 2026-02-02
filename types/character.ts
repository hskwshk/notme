// types/character.ts
export type Character = {
	id: number;
	name: string; // キャラクター名（例: めっちゃ歩く人！）
	image: string; // 画像パス
	timeGuide: string; // 時間の目安（例: 30分以上）
	description: string; // 説明文
};

export type Stamp = {
	id: number;
	stampName: string; // スタンプ名（例: めちゃ走った）
	image: string; // 画像パス
};
