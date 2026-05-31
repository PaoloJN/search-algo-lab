import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Provider as JotaiProvider } from "jotai";

import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
    title: "search-algo-lab · Pathfinding visualizer",
    description:
        "Interactive visualizer for pathfinding (A*, Dijkstra, Bidirectional) and maze-generation algorithms.",
    icons: "favicon.png",
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
            </body>
        </html>
    );
}
