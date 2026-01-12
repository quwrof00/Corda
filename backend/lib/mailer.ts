import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
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
            from: process.env.EMAIL_FROM || '"Corda" <no-reply@taskallo.com>',
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
