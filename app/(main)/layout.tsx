export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <main className="px-[20px] py-[80px]">{children}</main>;
}
