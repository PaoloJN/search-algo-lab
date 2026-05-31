import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Provider as JotaiProvider } from "jotai";

import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "search-algo-lab",
    description:
        "Interactive visualizer for pathfinding (A*, Dijkstra, Bidirectional) and maze-generation algorithms.",
    icons: "favicon.png",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <JotaiProvider>{children}</JotaiProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
