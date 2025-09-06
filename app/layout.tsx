import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { Providers } from "./providers";
import { AuthNavbar } from "@/components/AuthNavbar";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GameGen - AI Game Creation Platform",
    template: "%s | GameGen",
  },
  description:
    "Create pixel art games with AI-powered tools. Design, generate, and deploy games with natural language prompts.",
  keywords: [
    "AI game development",
    "pixel art",
    "game creation",
    "indie games",
    "no-code gaming",
    "GameGen",
  ],
  authors: [
    {
      name: "GameGen Team",
    },
  ],
  creator: "GameGen",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gamegen.ai",
    siteName: "GameGen",
    title: "GameGen - AI Game Creation Platform",
    description:
      "Create pixel art games with AI-powered tools. Design, generate, and deploy games with natural language prompts.",
    images: [
      {
        url: "https://gamegen.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "GameGen - AI Game Creation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GameGen - AI Game Creation Platform",
    description:
      "Create pixel art games with AI-powered tools. Design, generate, and deploy games with natural language prompts.",
    images: ["/og-image.png"],
    creator: "@gamegen",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex flex-col h-screen">
            <AuthNavbar />
            <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
