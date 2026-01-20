import mongoose from 'mongoose';
import fs from 'fs';
import PropertyInquiry from '../models/PropertyInquiry.js';
import ChatMessage from '../models/ChatMessage.js';
import Property from '../models/Property.js';
import Notification from '../models/Notification.js';

class InquiryController {
    // Create inquiry
    async createInquiry(req, res) {
        try {
            const { propertyId, message, offeredPrice } = req.body;
            const property = await Property.findById(propertyId);
            if (!property) return res.status(404).json({ message: 'Property not found' });
            if (!property.owner) return res.status(400).json({ message: 'Property has no assigned owner' });

            // Active inquiry check
            const existing = await PropertyInquiry.findOne({
                client: req.user.id,
                property: propertyId,
                status: { $nin: ['CANCELLED', 'REJECTED', 'PURCHASED'] }
            });
            if (existing) return res.status(400).json({ message: 'You already have an active inquiry for this property' });

            const inquiry = new PropertyInquiry({
                property: propertyId,
                client: req.user.id,
                owner: property.owner,
                status: 'PENDING',
                offeredPrice
            });
            await inquiry.save();

            // Notifications and messages
            if (message) {
                const chatMsg = new ChatMessage({
                    inquiry: inquiry._id,
                    sender: req.user.id,
                    messageType: 'TEXT',
                    content: message
                });
                await chatMsg.save();
            }

            if (offeredPrice) {
                const priceMsg = new ChatMessage({
                    inquiry: inquiry._id,
                    sender: req.user.id,
                    messageType: 'PRICE_OFFER',
                    content: `I would like to offer ₹${offeredPrice} for this property.`,
                    priceAmount: offeredPrice
                });
                await priceMsg.save();
            }

            // DB Notification
            const dbNotification = await Notification.create({
                recipient: property.owner,
                type: 'INQUIRY_NEW',
                title: 'New Property Inquiry',
                body: `You have received a new inquiry for ${property.title} from ${req.user.firstName} ${req.user.lastName}`,
                link: `/inquiries/${inquiry._id}`
            });

            // Real-time Notification via Socket.IO
            const io = req.app.get('io');
            if (io) {
                const ownerIdStr = property.owner.toString();
                io.to(`user_${ownerIdStr}`).emit('notification', dbNotification);
                // Also notify about new inquiry for UI refresh
                io.to(`user_${ownerIdStr}`).emit('inquiry_new', {
                    inquiry: inquiry,
                    message: `New inquiry from ${req.user.firstName}`
                });
            }

            res.status(201).json(inquiry);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // My inquiries (client)
    async getMyInquiries(req, res) {
        try {
            const inquiries = await PropertyInquiry.find({ client: req.user.id })
                .populate('property')
                .populate('owner', 'firstName lastName email')
                .sort({ updatedAt: -1 });
            res.json(inquiries);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Owner inquiries
    async getOwnerInquiries(req, res) {
        const start = Date.now();
        try {
            const userId = req.user.id.toString();
            const isAdmin = req.user.role === 'ADMIN';

            const logLine = `[${new Date().toISOString()}] Fetching inquiries for User: ${userId}, Role: ${req.user.role}, isAdmin: ${isAdmin}\n`;
            fs.appendFileSync('inquiry_debug.log', logLine);

            const query = isAdmin ? {} : { owner: new mongoose.Types.ObjectId(userId) };
            fs.appendFileSync('inquiry_debug.log', `[${new Date().toISOString()}] Query: ${JSON.stringify(query)}\n`);

            const inquiries = await PropertyInquiry.find(query)
                .populate('property', 'title price imageUrl address city state')
                .populate('client', 'firstName lastName email phoneNumber')
                .populate('owner', 'firstName lastName email')
                .sort({ updatedAt: -1 });

            fs.appendFileSync('inquiry_debug.log', `[${new Date().toISOString()}] Found: ${inquiries.length}\n`);
            if (inquiries.length > 0) {
                fs.appendFileSync('inquiry_debug.log', `[${new Date().toISOString()}] First ID: ${inquiries[0].id}\n`);
            }

            console.log(`[DEBUG] getOwnerInquiries - Found ${inquiries.length} inquiries`);
            if (inquiries.length > 0) {
                console.log(`[DEBUG] getOwnerInquiries - Sample Result Owner: ${inquiries[0].owner._id || inquiries[0].owner}`);
            }

            console.log(`Found ${inquiries.length} inquiries for owner ${userId} in ${Date.now() - start}ms`);
            res.json(inquiries);
        } catch (error) {
            console.error('getOwnerInquiries error:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Admin inquiries (all)
    async getAllAdminInquiries(req, res) {
        const start = Date.now();
        try {
            const inquiries = await PropertyInquiry.find({})
                .populate('property', 'title price imageUrl address city state')
                .populate('client', 'firstName lastName email')
                .populate('owner', 'firstName lastName email')
                .sort({ updatedAt: -1 });
            console.log(`Admin fetched ${inquiries.length} inquiries in ${Date.now() - start}ms`);
            res.json(inquiries);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get specific inquiry with messages
    async getInquiry(req, res) {
        const start = Date.now();
        try {
            const inquiryId = req.params.inquiryId;
            const inquiry = await PropertyInquiry.findById(inquiryId)
                .populate('property', 'title price imageUrl address city state')
                .populate('client', 'firstName lastName email phone')
                .populate('owner', 'firstName lastName email phone');

            if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

            // Authorization
            const isClient = inquiry.client._id.toString() === req.user.id;
            const isOwner = inquiry.owner._id.toString() === req.user.id;
            if (!isClient && !isOwner && req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Access denied' });
            }

            const messages = await ChatMessage.find({ inquiry: inquiryId })
                .populate('sender', 'firstName lastName email')
                .sort({ createdAt: 1 });

            // Mark as read (async, don't block response)
            ChatMessage.updateMany(
                { inquiry: inquiryId, sender: { $ne: req.user.id }, isRead: false },
                { $set: { isRead: true, readAt: new Date() } }
            ).exec().catch(err => console.error('Mark as read failed:', err));

            console.log(`Fetched inquiry detail ${inquiryId} in ${Date.now() - start}ms`);
            res.json({ inquiry, messages });
        } catch (error) {
            console.error('getInquiry error:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // Send message
    async sendMessage(req, res) {
        try {
            const { inquiryId } = req.params;
            const { content, messageType, priceAmount } = req.body;

            const inquiry = await PropertyInquiry.findById(inquiryId);
            if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

            const message = new ChatMessage({
                inquiry: inquiryId,
                sender: req.user.id,
                messageType: messageType || 'TEXT',
                content,
                priceAmount
            });
            await message.save();

            inquiry.updatedAt = new Date();
            if (messageType === 'PRICE_OFFER' || messageType === 'PRICE_COUNTER') {
                inquiry.status = 'NEGOTIATING';
            }
            await inquiry.save();

            // Notification
            const recipientId = req.user.id === inquiry.client.toString() ? inquiry.owner : inquiry.client;
            const dbNotification = await Notification.create({
                recipient: recipientId,
                type: 'INQUIRY_UPDATE',
                title: `New message from ${req.user.firstName}`,
                body: content.length > 50 ? content.substring(0, 50) + '...' : content,
                link: `/inquiries/${inquiryId}`
            });

            // Real-time Notification via Socket.IO
            const io = req.app.get('io');
            if (io) {
                const recipientIdStr = recipientId.toString();
                // Emit message
                const messageData = {
                    type: 'CHAT_MESSAGE',
                    inquiryId: inquiryId.toString(),
                    message: {
                        ...message.toJSON(),
                        sender: {
                            id: req.user.id,
                            firstName: req.user.firstName,
                            lastName: req.user.lastName
                        }
                    }
                };
                io.to(`user_${recipientIdStr}`).emit('receive_message', messageData);

                // Emit notification
                io.to(`user_${recipientIdStr}`).emit('notification', dbNotification);
            }

            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Status update
    async updateStatus(req, res) {
        try {
            const { inquiryId } = req.params;
            const { status } = req.query;

            const inquiry = await PropertyInquiry.findById(inquiryId);
            if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

            inquiry.status = status;
            await inquiry.save();

            res.json(inquiry);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Submit document (Client)
    async submitDocument(req, res) {
        try {
            const { inquiryId } = req.params;
            const { documentUrl, message } = req.body;

            const inquiry = await PropertyInquiry.findById(inquiryId);
            if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
            if (inquiry.client.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

            inquiry.documentUrl = documentUrl;
            inquiry.documentStatus = 'PENDING';
            inquiry.updatedAt = new Date();
            await inquiry.save();

            // Create chat message
            const chatMsg = new ChatMessage({
                inquiry: inquiryId,
                sender: req.user.id,
                messageType: 'DOCUMENT',
                content: message || 'Document submitted for verification',
                attachmentUrl: documentUrl,
                attachmentType: 'PDF'
            });
            await chatMsg.save();

            // Notify owner
            const dbNotification = await Notification.create({
                recipient: inquiry.owner,
                type: 'INQUIRY_UPDATE',
                title: 'New Document Submitted',
                body: `A document has been submitted for ${inquiryId}`,
                link: `/inquiries/${inquiryId}`
            });

            const io = req.app.get('io');
            if (io) {
                const ownerIdStr = inquiry.owner.toString();
                io.to(`user_${ownerIdStr}`).emit('receive_message', {
                    type: 'CHAT_MESSAGE',
                    inquiryId: inquiryId,
                    message: { ...chatMsg.toJSON(), sender: { id: req.user.id, firstName: req.user.firstName, lastName: req.user.lastName } }
                });
                io.to(`user_${ownerIdStr}`).emit('notification', dbNotification);
            }

            res.json(inquiry);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Verify document (Agent/Admin)
    async verifyDocument(req, res) {
        try {
            const { inquiryId } = req.params;
            const { status, message } = req.body; // APPROVED or REJECTED

            const inquiry = await PropertyInquiry.findById(inquiryId);
            if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

            const isAdmin = req.user.role === 'ADMIN';
            const isOwner = inquiry.owner.toString() === req.user.id;
            if (!isAdmin && !isOwner) return res.status(403).json({ message: 'Forbidden' });

            inquiry.documentStatus = status;
            inquiry.updatedAt = new Date();
            await inquiry.save();

            // Create chat message
            const chatMsg = new ChatMessage({
                inquiry: inquiryId,
                sender: req.user.id,
                messageType: 'DOCUMENT_DECISION',
                content: message || `Document ${status.toLowerCase()}`,
            });
            await chatMsg.save();

            // Notify client
            const dbNotification = await Notification.create({
                recipient: inquiry.client,
                type: 'INQUIRY_UPDATE',
                title: `Document ${status}`,
                body: chatMsg.content,
                link: `/inquiries/${inquiryId}`
            });

            const io = req.app.get('io');
            if (io) {
                const clientIdStr = inquiry.client.toString();
                io.to(`user_${clientIdStr}`).emit('receive_message', {
                    type: 'CHAT_MESSAGE',
                    inquiryId: inquiryId,
                    message: { ...chatMsg.toJSON(), sender: { id: req.user.id, firstName: req.user.firstName, lastName: req.user.lastName } }
                });
                io.to(`user_${clientIdStr}`).emit('notification', dbNotification);
            }

            res.json(inquiry);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Approve for payment (Agent/Admin)
    async approveForPayment(req, res) {
        try {
            const { inquiryId } = req.params;
            const { price } = req.body;

            const inquiry = await PropertyInquiry.findById(inquiryId);
            if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
            if (inquiry.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

            inquiry.status = 'AGREED';
            inquiry.agreedPrice = price || inquiry.offeredPrice;
            inquiry.updatedAt = new Date();
            await inquiry.save();

            // Create system message
            const sysMsg = new ChatMessage({
                inquiry: inquiryId,
                sender: req.user.id,
                messageType: 'SYSTEM',
                content: `Booking approved for payment at ₹${inquiry.agreedPrice.toLocaleString()}. Please proceed to payment.`,
            });
            await sysMsg.save();

            // Notify client
            const dbNotification = await Notification.create({
                recipient: inquiry.client,
                type: 'INQUIRY_UPDATE',
                title: 'Ready for Payment',
                body: `Your booking for inquiry ${inquiryId} has been approved. You can now proceed to payment.`,
                link: `/inquiries/${inquiryId}`
            });

            const io = req.app.get('io');
            if (io) {
                const clientIdStr = inquiry.client.toString();
                io.to(`user_${clientIdStr}`).emit('receive_message', {
                    type: 'CHAT_MESSAGE',
                    inquiryId: inquiryId,
                    message: { ...sysMsg.toJSON(), sender: { id: req.user.id, firstName: req.user.firstName, lastName: req.user.lastName } }
                });
                io.to(`user_${clientIdStr}`).emit('notification', dbNotification);
            }

            res.json(inquiry);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Process payment (Client)
    async processPayment(req, res) {
        try {
            const { inquiryId } = req.params;
            const inquiry = await PropertyInquiry.findById(inquiryId).populate('property');
            if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
            if (inquiry.client.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
            if (inquiry.status !== 'AGREED') return res.status(400).json({ message: 'Inquiry not in payment-ready state' });

            const amount = inquiry.agreedPrice;
            const description = `Payment for property: ${inquiry.property.title}`;

            // Deduct from wallet
            const walletService = (await import('../services/walletService.js')).default;
            const success = await walletService.deductMoney(req.user.id, amount, description, inquiryId);

            if (!success) {
                return res.status(400).json({ message: 'Insufficient wallet balance' });
            }

            inquiry.status = 'PURCHASED';
            inquiry.closedAt = new Date();
            await inquiry.save();

            // Update property status
            const property = await Property.findById(inquiry.property);
            if (property) {
                property.status = property.listingType === 'SALE' ? 'SOLD' : 'RENTED';
                await property.save();
            }

            // Messages and notifications
            const sysMsg = new ChatMessage({
                inquiry: inquiryId,
                sender: req.user.id,
                messageType: 'SYSTEM',
                content: `Payment of ₹${amount.toLocaleString()} successful! Status updated to PURCHASED.`,
            });
            await sysMsg.save();

            // Notify owner
            const dbNotification = await Notification.create({
                recipient: inquiry.owner,
                type: 'INQUIRY_UPDATE',
                title: 'Property Purchased',
                body: `Payment received for ${inquiry.property.title}. Amount: ₹${amount.toLocaleString()}`,
                link: `/inquiries/${inquiryId}`
            });

            const io = req.app.get('io');
            if (io) {
                io.to(`user_${inquiry.owner.toString()}`).emit('receive_message', {
                    type: 'CHAT_MESSAGE',
                    inquiryId: inquiryId,
                    message: { ...sysMsg.toJSON(), sender: { id: req.user.id, firstName: req.user.firstName, lastName: req.user.lastName } }
                });
                io.to(`user_${inquiry.owner.toString()}`).emit('notification', dbNotification);
            }

            res.json({ message: 'Payment successful', inquiry });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Unread count
    async getUnreadCount(req, res) {
        try {
            // Find all inquiries involved with user
            const userId = req.user.id.toString();
            const userInqs = await PropertyInquiry.find({
                $or: [{ client: userId }, { owner: userId }]
            });
            const inqIds = userInqs.map(i => i._id);

            const unreadCount = await ChatMessage.countDocuments({
                inquiry: { $in: inqIds },
                sender: { $ne: userId },
                isRead: false
            });

            res.json({ unreadCount });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new InquiryController();
