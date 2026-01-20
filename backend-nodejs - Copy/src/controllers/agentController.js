import User from '../models/User.js';
import Property from '../models/Property.js';
import PropertyInquiry from '../models/PropertyInquiry.js';
import Notification from '../models/Notification.js';
import mailService from '../services/mailService.js';

class AgentController {
    async messageAgent(req, res) {
        try {
            const { agentId } = req.params;
            const { propertyId, name, email, phone, message } = req.body;

            const agent = await User.findById(agentId);
            if (!agent) return res.status(404).json({ message: 'Agent not found' });
            if (!agent.email) return res.status(400).json({ message: 'Agent does not have a contact email' });

            const subject = `New inquiry from ${name || 'Prospect'} ${propertyId ? 'about property #' + propertyId : ''}`;
            let body = `You have received a new inquiry from the RealEstate Hub website.\n\n`;
            if (propertyId) body += `Property ID: ${propertyId}\n`;
            if (name) body += `Name: ${name}\n`;
            if (email) body += `Email: ${email}\n`;
            if (phone) body += `Phone: ${phone}\n`;
            body += `\nMessage:\n${message || ''}\n`;

            await mailService.sendSimple(agent.email, subject, body);

            // Log inquiry if authenticated
            if (req.user && propertyId) {
                const property = await Property.findById(propertyId);
                if (property) {
                    await PropertyInquiry.create({
                        property: propertyId,
                        client: req.user.id,
                        owner: agentId,
                        status: 'ACTIVE'
                    });

                    await Notification.create({
                        recipient: agentId,
                        type: 'INQUIRY_NEW',
                        title: 'New sale inquiry',
                        body: `From: ${req.user.firstName} ${req.user.lastName}\nProperty ID: ${propertyId}`,
                        link: '/inquiries/owner'
                    });
                }
            }

            res.json({ status: 'sent' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new AgentController();
