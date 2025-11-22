import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
export const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: `"Cheq-mate" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    };
    try {
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
    }
};
