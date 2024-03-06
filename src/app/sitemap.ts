import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap>{

    return [
        {
            url: `https://cph-nine.vercel.app`,
            lastModified: "",
            changeFrequency: "yearly"
        },
        {
            url: `https://cph-nine.vercel.app/dashboard`,
            changeFrequency: "yearly"
        },
        {
            url: `https://cph-nine.vercel.app/pricing`,
            changeFrequency: "yearly"
        }
    ]
}