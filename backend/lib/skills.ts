
export type CanonicalSkill =
    | "Frontend"
    | "Backend"
    | "Uiux"
    | "Mobile"
    | "Devops"
    | "Database"
    | "Testing"
    | "Ai_ml"
    | "Blockchain"
    | "Security"
    | "Product"
    | "Data"
    | "Cloud";

// Note: Keys are PascalCase to match the desired output "Canonical" format.
// The values are lowercased for easier case-insensitive matching.
export const SKILL_ALIASES: Record<string, string[]> = {
    Frontend: [
        "frontend", "ui", "web", "react", "nextjs", "vue", "angular", "svelte",
        "html", "css", "javascript", "typescript", "tailwind", "bootstrap",
        "redux", "zustand", "framer"
    ],
    Backend: [
        "backend", "server", "api", "node", "express", "nestjs", "fastapi",
        "django", "flask", "spring", "java", "python", "golang", "go",
        "csharp", "dotnet", "auth"
    ],
    Uiux: [
        "uiux", "ux", "ui", "design", "productdesign", "figma", "wireframing",
        "prototyping", "accessibility"
    ],
    Mobile: [
        "mobile", "android", "ios", "reactnative", "flutter", "swift", "kotlin"
    ],
    Devops: [
        "devops", "infra", "infrastructure", "ci", "cd", "docker", "kubernetes",
        "k8s", "terraform", "ansible", "jenkins", "githubactions"
    ],
    Database: [
        "database", "db", "sql", "postgres", "mysql", "sqlite", "mongodb",
        "redis", "prisma", "orm"
    ],
    Testing: [
        "testing", "tests", "qa", "jest", "vitest", "cypress", "playwright",
        "selenium", "unit", "integration", "e2e"
    ],
    Ai_ml: [
        "ai", "ml", "machinelearning", "deeplearning", "llm", "nlp",
        "computervision", "tensorflow", "pytorch", "langchain", "rag", "embeddings"
    ],
    Blockchain: [
        "blockchain", "web3", "ethereum", "solidity", "smartcontracts",
        "polygon", "defi", "nft"
    ],
    Security: [
        "security", "infosec", "auth", "authentication", "authorization",
        "oauth", "jwt", "cryptography", "pentesting"
    ],
    Product: [
        "product", "pm", "productmanagement", "requirements", "roadmap", "userstories"
    ],
    Data: [
        "data", "analytics", "datascience", "pandas", "numpy", "etl",
        "bigquery", "spark"
    ],
    Cloud: [
        "cloud", "aws", "gcp", "azure", "serverless", "lambda", "vercel", "netlify"
    ]
};

// Returns the Canonical Skill (e.g. "Frontend") or null if not found
export function getCanonicalSkill(input: string): string | null {
    if (!input) return null;
    const normalizedInput = input.trim().toLowerCase().replace(/\s+/g, "");

    for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
        // Check if input matches the canonical name itself (case-insensitive)
        if (canonical.toLowerCase() === normalizedInput) return canonical;
        // Check aliases
        if (aliases.includes(normalizedInput)) {
            return canonical;
        }
    }
    return null;
}

// Just capitalizes first letter, useful for user aliases which we keep as-is but formatted
export function formatSkill(input: string): string {
    if (!input || typeof input !== 'string') return "";
    const trimmed = input.trim();
    if (!trimmed) return "";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
