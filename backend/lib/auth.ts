import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "./prisma.js";
import { sendEmail } from "./mailer.js";

const router = Router();

// REGISTER
router.post("/register", async (req, res) => {

  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email, and password are required" });

    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name, email, password: hashed },
    });

    // Generate verification token
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    });

    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    await sendEmail(
      email,
      "Verify your email - TaskAllo",
      `<div style="font-family: Arial, sans-serif; color: #333;">
         <h2>Welcome to TaskAllo!</h2>
         <p>Please verify your email address to get started.</p>
         <a href="${verifyLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
         <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't create an account, you can ignore this email.</p>
       </div>`
    );

    return res.status(201).json({ message: "User registered successfully. Please check your email to verify." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to register user" });
  }
});

// VERIFY EMAIL
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const storedToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!storedToken || storedToken.expires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { identifier: email } = storedToken;

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    });

    await prisma.verificationToken.delete({ where: { token } });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify email error:", err);
    return res.status(500).json({ message: "Failed to verify email" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, user.password || "");
    if (!isValid) return res.status(401).json({ message: "Invalid password" });

    const { password: _, ...safeUser } = user;

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Store in VerificationToken table
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires
      }
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    console.log(`[RESET PASSWORD] Link for ${email}: ${resetLink}`);

    await sendEmail(
      email,
      "Reset Your Password - TaskAllo",
      `<div style="font-family: Arial, sans-serif; color: #333;">
         <h2>Reset Password</h2>
         <p>You requested a password reset for your TaskAllo account.</p>
         <p>Click the button below to reset your password:</p>
         <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
         <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't ask for this, you can ignore this email.</p>
       </div>`
    );

    return res.status(200).json({ message: "Reset link sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Failed to process request" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Token and password required" });

    // Verify token
    const storedToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!storedToken || storedToken.expires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { identifier: email } = storedToken;

    // Update User
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashed }
    });

    // Clean up used token
    await prisma.verificationToken.delete({ where: { token } });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

// GOOGLE LOGIN
router.post("/google", async (req, res) => {
  try {
    const { email, name, image, _googleId } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashed = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email,
          password: hashed,
          image,
          emailVerified: new Date(), // Trust Google verified emails
        },
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallbacksecret",
      { expiresIn: "7d" }
    );

    const { password: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
});

export default router;
