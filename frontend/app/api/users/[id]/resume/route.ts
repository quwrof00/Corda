export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
// @ts-expect-error: No types available for pdf-parse
import pdf from "pdf-parse/lib/pdf-parse";
import mammoth from "mammoth";

// Function to call OpenRouter for skill extraction
const extractSkillsWithOpenRouter = async (text: string): Promise<string[]> => {
    console.log("[Skill Extraction] Starting extraction...");
    const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    const OPENROUTER_MODEL = "google/gemma-3-12b-it:free";
    const API_KEY = process.env.OPENROUTER_API_KEY;

    if (!text || text.trim().length === 0) {
        console.log("[Skill Extraction] No text provided for extraction");
        return [];
    }

    if (!API_KEY) {
        console.warn("[Skill Extraction] OPENROUTER_API_KEY is missing. Skipping.");
        return [];
    }

    console.log(`[Skill Extraction] Processing text length: ${text.length} chars`);

    // Truncate text to avoid massive usage
    const truncatedText = text.slice(0, 8000);

    const prompt = `
    Extract a list of technical skills from the following resume text.
    Return ONLY a JSON array of strings (e.g., ["React", "Python", "SQL"]).
    Do not include any other text, markdown formatting, or explanations.

    Resume Text:
    ${truncatedText}
  `;

    try {
        console.log(`[Skill Extraction] Sending request to OpenRouter model: ${OPENROUTER_MODEL}`);
        const start = Date.now();

        const response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
                "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
                "X-Title": "TaskAllo Skill Extractor"
            },
            body: JSON.stringify({
                model: OPENROUTER_MODEL,
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
            }),
        });

        const duration = Date.now() - start;
        console.log(`[Skill Extraction] OpenRouter response received in ${duration}ms. Status: ${response.status}`);

        if (!response.ok) {
            console.error(`[Skill Extraction] Failed: ${response.status} ${response.statusText}`);
            const errText = await response.text();
            console.error(`[Skill Extraction] Error details: ${errText}`);
            return [];
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        console.log("[Skill Extraction] Raw LLM content:", content);

        if (!content) {
            console.warn("[Skill Extraction] Empty content from LLM");
            return [];
        }

        // Clean up markdown code blocks if present (e.g. ```json ... ```)
        const jsonContent = content.replace(/```json\n?|\n?```/g, "").trim();

        try {
            const skills = JSON.parse(jsonContent);
            if (Array.isArray(skills)) {
                console.log(`[Skill Extraction] Successfully parsed ${skills.length} skills:`, skills);
                return skills;
            } else {
                console.warn("[Skill Extraction] Parsed JSON is not an array:", skills);
            }
        } catch (e) {
            console.error("[Skill Extraction] Failed to parse JSON:", e);
            console.log("[Skill Extraction] Failed content was:", content);
        }
        return [];

    } catch (error) {
        console.error("[Skill Extraction] Unexpected error:", error);
        return [];
    }
};

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

        // Ensure user can only upload their own resume
        if (session.user.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("resume") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Only PDF and Word documents are allowed" },
                { status: 400 }
            );
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size must be less than 5MB" },
                { status: 400 }
            );
        }

        // Prepare file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[Resume Upload] File received. Name: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);

        // Extract Text & Skills
        let extractedText = "";
        try {
            if (file.type === "application/pdf") {
                console.log("[Resume Upload] Parsing PDF...");
                const result = await pdf(buffer);
                extractedText = result.text;
                console.log("Extracted file text: ", extractedText);

                console.log(`[Resume Upload] PDF extracted. Text length: ${extractedText.length}`);
            } else if (
                file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                file.type === "application/msword"
            ) {
                console.log("[Resume Upload] Parsing Word Document...");
                const result = await mammoth.extractRawText({ buffer });
                extractedText = result.value;
                console.log(`[Resume Upload] Word extracted. Text length: ${extractedText.length}`);
            }
        } catch (parseError) {
            console.error("[Resume Upload] Text extraction failed:", parseError);
            // Determine if we should fail or just duplicate the warning. We'll proceed with upload but no skills.
        }

        const newSkills = await extractSkillsWithOpenRouter(extractedText);
        console.log(`[Resume Upload] Skills identified: ${newSkills.length}`);

        const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const cookie = req.headers.get("cookie");

        // Fetch current user skills to merge
        const userResponse = await fetch(
            `${apiUrl}/api/users/${id}`,
            {
                headers: {
                    Cookie: cookie || "",
                },
            }
        );

        let mergedSkills: string[] = [];
        if (userResponse.ok) {
            const user = await userResponse.json();
            const existingSkills = user.skills || [];
            // Delete old resume if exists
            if (user.resumeUrl) {
                try {
                    console.log("[Resume Upload] Deleting old resume...");
                    await del(user.resumeUrl);
                } catch (err) {
                    console.error("[Resume Upload] Error deleting old resume:", err);
                }
            }

            // Merge unique skills
            mergedSkills = Array.from(new Set([...existingSkills, ...newSkills]));
        } else {
            console.warn("[Resume Upload] Failed to fetch current user to merge skills.");
            mergedSkills = newSkills;
        }

        // Upload to Vercel Blob
        const blob = await put(`resumes/${id}-${Date.now()}-${file.name}`, file, {
            access: "public",
            addRandomSuffix: false,
        });

        // Update user record with resume URL and new skills
        const response = await fetch(
            `${apiUrl}/api/users/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Cookie: cookie || "",
                },
                body: JSON.stringify({
                    resumeUrl: blob.url
                    // skills: mergedSkills -- We do NOT save skills automatically anymore. The user must review and save.
                }),
            }
        );

        if (!response.ok) {
            // If database update fails, delete the uploaded blob
            await del(blob.url);
            throw new Error("Failed to update user");
        }

        return NextResponse.json({
            resumeUrl: blob.url,
            extractedSkills: newSkills,
            allSkills: mergedSkills
        }, { status: 200 });
    } catch (error) {
        console.error("Resume upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: errorMessage || "Failed to upload resume" },
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

    try {
        const session = await getServerSession(getAuthOptions());

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.id !== id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const apiUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Get current resume URL from user
        const userResponse = await fetch(
            `${apiUrl}/api/users/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            }
        );

        if (!userResponse.ok) {
            throw new Error("Failed to fetch user");
        }

        const user = await userResponse.json();

        if (user.resumeUrl) {
            // Delete from Vercel Blob
            try {
                await del(user.resumeUrl);
            } catch (err) {
                console.error("Error deleting blob:", err);
            }

            // Update user record to remove resume URL
            const response = await fetch(
                `${apiUrl}/api/users/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                    body: JSON.stringify({ resumeUrl: null }),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update user");
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Resume delete error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: errorMessage || "Failed to delete resume" },
            { status: 500 }
        );
    }
}
