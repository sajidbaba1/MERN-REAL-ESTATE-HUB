import mailService from '../services/mailService.js';

class SystemController {
    async sendTestEmail(req, res) {
        try {
            const { to, subject, text } = req.body;
            if (!to) return res.status(400).json({ message: "'to' is required" });

            const finalSubject = subject || "Test Email";
            const finalText = text || "Hello from RealEstate Hub";

            const success = await mailService.sendSimple(to, finalSubject, finalText);
            if (success) {
                res.json({ status: 'sent' });
            } else {
                res.status(500).json({ message: 'Mail sending failed' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new SystemController();
