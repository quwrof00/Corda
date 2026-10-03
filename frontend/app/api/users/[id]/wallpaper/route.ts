export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { id } = params;

    try {
        const session = await getServerSession(getAuthOptions());

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Ensure user can only upload their own wallpaper
        if (session.user.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("wallpaper") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/avif"
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPEG, PNG, WebP, and AVIF images are allowed" },
                { status: 400 }
            );
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size must be less than 10MB" },
                { status: 400 }
            );
        }

        console.log(`[Wallpaper Upload] File received. Name: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);



        // Upload to Vercel Blob
        const blob = await put(`wallpapers/${id}-${Date.now()}-${file.name}`, file, {
            access: "public",
            addRandomSuffix: false,
        });

        // Update user record with wallpaper URL
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { wallpaperUrl: blob.url }
        });

        if (!updatedUser) {
            // If database update fails, delete the uploaded blob
            await del(blob.url);
            throw new Error("Failed to update user");
        }

        return NextResponse.json({
            wallpaperUrl: blob.url
        }, { status: 200 });
    } catch (error) {
        console.error("Wallpaper upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: errorMessage || "Failed to upload wallpaper" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { id } = params;
    const urlToDelete = req.nextUrl.searchParams.get("url");

    try {
        const session = await getServerSession(getAuthOptions());

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get current wallpaper URL from user
        const user = await prisma.user.findUnique({
            where: { id },
            select: { wallpaperUrl: true }
        });

        if (!user) {
            throw new Error("Failed to fetch user");
        }

        const targetUrl = urlToDelete || user.wallpaperUrl;

        if (targetUrl) {
            // Delete from Vercel Blob
            try {
                await del(targetUrl);
            } catch (err) {
                console.error("Error deleting blob:", err);
            }

            // If the deleted URL is the active one, update DB to null
            if (targetUrl === user.wallpaperUrl) {
                const updatedUser = await prisma.user.update({
                    where: { id },
                    data: { wallpaperUrl: null }
                });

                if (!updatedUser) {
                    throw new Error("Failed to update user");
                }
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Wallpaper delete error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: errorMessage || "Failed to delete wallpaper" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { id } = params;

    try {
        const session = await getServerSession(getAuthOptions());

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json({ error: "No URL provided" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { wallpaperUrl: url }
        });

        if (!updatedUser) {
            throw new Error("Failed to update user");
        }

        return NextResponse.json({
            success: true,
            wallpaperUrl: updatedUser.wallpaperUrl
        }, { status: 200 });
    } catch (error) {
        console.error("Wallpaper update error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: errorMessage || "Failed to update wallpaper" },
            { status: 500 }
        );
    }
}
