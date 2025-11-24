import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const DEFAULT_TIMEOUT_MS = 10_000;
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: false, // true for 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
});
transporter.verify()
    .then(() => console.log('Email transporter verified'))
    .catch(err => console.error('Email transporter verify failed:', err?.message || err));
export const sendEmail = (to, subject, text, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    const mailOptions = {
        from: `"Cheq-mate" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    };
    const sendPromise = transporter.sendMail(mailOptions);
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('sendMail timeout')), timeoutMs));
    return Promise.race([sendPromise, timeout]);
};
