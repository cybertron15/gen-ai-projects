import { list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { blobs } = await list();
        return NextResponse.json(blobs);
    } catch (error) {
        console.error("Error listing blobs:", error);
        return NextResponse.json({ error: "Error listing blobs" }, { status: 500 });
    }
}