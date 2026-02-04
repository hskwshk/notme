import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Next Tokuzou Kit",
	description: "Next.js + Hono + Better Auth demo",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 text-zinc-900 antialiased`}
			>
				<SiteHeader />
				{/* ページ側で個別に余白を管理できるよう、メインコンテナのパディングを最小限に。 */}
				<main className="mx-auto w-full max-w-5xl">{children}</main>
				<BottomNav />
			</body>
		</html>
	);
}
