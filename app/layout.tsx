import type { Metadata } from "next";
import { minikitConfig } from "../minikit.config";

// Force dynamic rendering for the entire app to avoid SSR issues with Privy/Wagmi
export const dynamic = 'force-dynamic';
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import { MobileOnlyWrapper } from "@/components/mobile-only-wrapper";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Try ${minikitConfig.miniapp.name} Now`,
          action: {
            name: `Launch ${minikitConfig.miniapp.name}`,
            type: "launch_frame",
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>
          <MobileOnlyWrapper>{children}</MobileOnlyWrapper>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
