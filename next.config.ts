import { config } from "env";
import type { NextConfig } from "next";

config();

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "barbar.foo",
			},
			{
				protocol: "https",
				hostname: "foo.bar",
			},
		],
	},
};

export default nextConfig;
