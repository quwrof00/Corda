import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    // If no credentials, log and mock
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("WARN: No SMTP credentials provided. Mocking email send.");
        console.log(`To: ${to}, Subject: ${subject}`);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"TaskAllo" <no-reply@taskallo.com>',
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
