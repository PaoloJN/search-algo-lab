import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Provider as JotaiProvider } from "jotai";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const SITE_URL = "https://pathfindinglab.vercel.app";
const TITLE = "pathfinding-lab · Pathfinding visualizer";
const DESCRIPTION =
    "Interactive visualizer for pathfinding (A*, Dijkstra, BFS, DFS, Greedy) and maze-generation algorithms.";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: TITLE,
        template: "%s · pathfinding-lab",
    },
    description: DESCRIPTION,
    applicationName: "pathfinding-lab",
    keywords: [
        "pathfinding",
        "visualizer",
        "A* algorithm",
        "Dijkstra",
        "BFS",
        "DFS",
        "Greedy best-first",
        "maze generation",
        "recursive division",
        "Prim's algorithm",
        "computer science",
        "algorithms",
    ],
    authors: [{ name: "Paolo Nessim", url: "https://github.com/PaoloJN" }],
    creator: "Paolo Nessim",
    publisher: "Paolo Nessim",
    category: "technology",
    alternates: { canonical: "/" },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "any" },
            { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
            { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
            { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
            { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
        shortcut: "/favicon.ico",
    },
    manifest: "/site.webmanifest",
    openGraph: {
        type: "website",
        url: SITE_URL,
        title: TITLE,
        description: DESCRIPTION,
        siteName: "pathfinding-lab",
        images: [
            {
                url: "/og.png",
                width: 1200,
                height: 630,
                alt: "pathfinding-lab — pathfinding and maze-generation visualizer",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: TITLE,
        description: DESCRIPTION,
        images: ["/og.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#151515" },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={`${GeistSans.variable} ${GeistMono.variable}`}
        >
            <body>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <JotaiProvider>{children}</JotaiProvider>
                </ThemeProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
