import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: "*", allow: "/" }],
        sitemap: "https://pathfindinglab.vercel.app/sitemap.xml",
        host: "https://pathfindinglab.vercel.app",
    };
}
