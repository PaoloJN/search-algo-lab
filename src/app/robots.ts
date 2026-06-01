import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: "*", allow: "/" }],
        sitemap: "https://pathfinding-lab.vercel.app/sitemap.xml",
        host: "https://pathfinding-lab.vercel.app",
    };
}
