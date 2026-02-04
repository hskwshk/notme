// import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";

// import { BottomNav } from "@/components/bottom-nav";
// import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// const geistSans = Geist({
// 	variable: "--font-geist-sans",
// 	subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
// 	variable: "--font-geist-mono",
// 	subsets: ["latin"],
// });

// export const metadata: Metadata = {
// 	title: "Next Tokuzou Kit",
// 	description: "Next.js + Hono + Better Auth demo",
// };

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
