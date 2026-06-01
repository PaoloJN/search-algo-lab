import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: "*", allow: "/" }],
        sitemap: "https://pathfinding.paolonessim.com/sitemap.xml",
        host: "https://pathfinding.paolonessim.com",
    };
}
