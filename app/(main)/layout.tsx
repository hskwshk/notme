export default function MainLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <main className="px-[20px] pt-[60px]">{children}</main>;
}
