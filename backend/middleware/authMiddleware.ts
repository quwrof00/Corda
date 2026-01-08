import { Request, Response, NextFunction } from "express";
import { getToken } from "next-auth/jwt";

interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = await getToken({
            req: req as any,
            secret: process.env.NEXTAUTH_SECRET
        });

        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No session" });
        }

        // Map NextAuth token fields to req.user expected structure
        req.user = {
            id: token.sub || token.id,
            email: token.email,
            ...token
        };

        next();
    } catch (err) {
        console.error("Auth Error:", err);
        res.status(401).json({ error: "Authentication failed" });
    }
};
