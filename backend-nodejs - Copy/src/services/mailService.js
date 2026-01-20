import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
    }
});

class MailService {
    async sendSimple(to, subject, body) {
        const mailOptions = {
            from: `"event" <${process.env.SMTP_USERNAME}>`,
            to,
            subject,
            text: body
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Mail sending failed:', error);
            return false;
        }
    }

    async sendHtml(to, subject, html) {
        const mailOptions = {
            from: `"event" <${process.env.SMTP_USERNAME}>`,
            to,
            subject,
            html
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Mail sending failed (HTML):', error.message);
            return false;
        }
    }
}

export default new MailService();
export { transporter };
