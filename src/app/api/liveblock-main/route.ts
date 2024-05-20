import { NextRequest } from "next/server";
import { liveblocks } from "@/lib/elegance";

export async function POST(request:NextRequest) {
    try {
        const { fileId } = await request.json()
        // create room //
        const room = await liveblocks.createRoom(`document-${fileId}`, {
            defaultAccesses: ["room:write"],
        });

        // create authorization token for access //
    } catch (error) {
        console.log(error)
    }
}