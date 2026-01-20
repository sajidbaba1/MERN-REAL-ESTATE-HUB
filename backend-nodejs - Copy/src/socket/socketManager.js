import jwt from 'jsonwebtoken';
import ChatMessage from '../models/ChatMessage.js';
import PropertyInquiry from '../models/PropertyInquiry.js';
import Property from '../models/Property.js';
import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Notification from '../models/Notification.js';

export const initializeSocket = (io) => {
    // Middleware for authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.id}`);

        // Join user's personal room for notifications
        socket.join(`user_${socket.user.id}`);

        // Join specific inquiry rooms if needed, or just handle joining via client event
        socket.on('join_user', (userId) => {
            socket.join(`user_${userId}`);
        });

        socket.on('send_message', async (data) => {
            try {
                // Save message to DB
                // This is a simplified implementation. robust one should verify inquiry ownership
                const { inquiryId, content, messageType, priceAmount } = data;

                const inquiry = await PropertyInquiry.findById(inquiryId);
                if (!inquiry) return; // Error handling

                const message = new ChatMessage({
                    inquiry: inquiryId,
                    sender: socket.user.id,
                    content,
                    messageType,
                    priceAmount
                });
                await message.save();

                // Update Inquiry status and prices based on messageType
                let statusUpdated = false;
                if (messageType === 'PRICE_OFFER' || messageType === 'PRICE_COUNTER') {
                    inquiry.offeredPrice = priceAmount;
                    inquiry.status = 'NEGOTIATING';
                    statusUpdated = true;
                } else if (messageType === 'PRICE_ACCEPT') {
                    inquiry.agreedPrice = priceAmount || inquiry.offeredPrice;
                    inquiry.status = 'AGREED';
                    statusUpdated = true;
                } else if (messageType === 'PRICE_REJECT') {
                    inquiry.status = 'NEGOTIATING';
                    statusUpdated = true;
                }

                if (statusUpdated) {
                    await inquiry.save();
                    // Notify both participants of status update
                    const statusData = {
                        type: 'STATUS_UPDATE',
                        inquiryId,
                        status: inquiry.status,
                        offeredPrice: inquiry.offeredPrice,
                        agreedPrice: inquiry.agreedPrice
                    };
                    io.to(`user_${inquiry.client.toString()}`).emit('status_update', statusData);
                    io.to(`user_${inquiry.owner.toString()}`).emit('status_update', statusData);
                }

                // Determine recipient
                const recipientId = socket.user.id === inquiry.client.toString()
                    ? inquiry.owner.toString()
                    : inquiry.client.toString();

                // Create DB Notification for the message
                const dbNotification = await Notification.create({
                    recipient: recipientId,
                    type: 'INQUIRY_UPDATE',
                    title: `New message from ${socket.user.firstName}`,
                    body: content.length > 50 ? content.substring(0, 50) + '...' : content,
                    link: `/inquiries/${inquiryId}`
                });

                const messageData = {
                    type: 'CHAT_MESSAGE',
                    inquiryId,
                    message: {
                        ...message.toJSON(),
                        sender: {
                            id: socket.user.id,
                            firstName: socket.user.firstName,
                            lastName: socket.user.lastName
                        }
                    }
                };

                // Emit to recipient
                io.to(`user_${recipientId}`).emit('receive_message', messageData);
                io.to(`user_${recipientId}`).emit('notification', dbNotification);

                // Emit back to sender (echo)
                socket.emit('receive_message', messageData);

            } catch (error) {
                console.error('Socket message error:', error);
            }
        });

        socket.on('purchase_request', async (data) => {
            try {
                const { inquiryId, finalPrice, message: content } = data;
                const inquiry = await PropertyInquiry.findById(inquiryId).populate('property');
                if (!inquiry) {
                    socket.emit('error_message', { message: 'Inquiry not found' });
                    return;
                }

                // 1. Validate Wallet
                const buyerWallet = await Wallet.findOne({ user: socket.user.id });
                if (!buyerWallet) {
                    socket.emit('error_message', { message: 'Wallet not found. Please create one.' });
                    return;
                }
                if (buyerWallet.balance < finalPrice) {
                    socket.emit('error_message', { message: `Insufficient wallet balance. Required: ₹${finalPrice}, Available: ₹${buyerWallet.balance}` });
                    return;
                }

                // 2. Transact - Debit Buyer
                buyerWallet.balance -= finalPrice;
                await buyerWallet.save();

                await WalletTransaction.create({
                    wallet: buyerWallet._id,
                    type: 'DEBIT',
                    amount: finalPrice,
                    description: `Purchase of property: ${inquiry.property.title}`,
                    referenceId: inquiry._id,
                    referenceModel: 'PropertyInquiry'
                });

                // 3. Transact - Credit Owner
                const ownerId = inquiry.owner;
                let ownerWallet = await Wallet.findOne({ user: ownerId });
                if (!ownerWallet) {
                    ownerWallet = await Wallet.create({ user: ownerId });
                }
                ownerWallet.balance += finalPrice;
                await ownerWallet.save();

                await WalletTransaction.create({
                    wallet: ownerWallet._id,
                    type: 'CREDIT',
                    amount: finalPrice,
                    description: `Sale of property: ${inquiry.property.title}`,
                    referenceId: inquiry._id,
                    referenceModel: 'PropertyInquiry'
                });

                // 4. Update Statuses
                inquiry.status = 'PURCHASED';
                inquiry.closedAt = new Date();
                await inquiry.save();

                await Property.findByIdAndUpdate(inquiry.property._id, { status: 'SOLD' });

                // 5. Save Confirmation Message
                const message = new ChatMessage({
                    inquiry: inquiryId,
                    sender: socket.user.id,
                    content: content || `I have purchased this property for ₹${finalPrice?.toLocaleString()}. Transaction Complete.`,
                    messageType: 'PURCHASE_CONFIRMED',
                    priceAmount: finalPrice
                });
                await message.save();

                const messageData = {
                    type: 'CHAT_MESSAGE',
                    inquiryId,
                    message: {
                        ...message.toJSON(),
                        sender: {
                            id: socket.user.id,
                            firstName: socket.user.firstName,
                            lastName: socket.user.lastName
                        }
                    }
                };

                const statusData = {
                    type: 'STATUS_UPDATE',
                    inquiryId,
                    status: 'PURCHASED'
                };

                // Emit to both
                io.to(`user_${inquiry.client.toString()}`).emit('receive_message', messageData);
                io.to(`user_${inquiry.owner.toString()}`).emit('receive_message', messageData);
                io.to(`user_${inquiry.client.toString()}`).emit('status_update', statusData);
                io.to(`user_${inquiry.owner.toString()}`).emit('status_update', statusData);

                // Send success notification to buyer
                socket.emit('purchase_success', {
                    message: 'Purchase successful! Amount deducted from your wallet.',
                    newBalance: buyerWallet.balance
                });

            } catch (error) {
                console.error('Socket purchase_request error:', error);
                socket.emit('error_message', { message: 'Transaction failed: ' + error.message });
            }
        });

        socket.on('confirm_purchase', async (data) => {
            try {
                const { inquiryId, message: content } = data;
                const inquiry = await PropertyInquiry.findById(inquiryId).populate('property');
                if (!inquiry) {
                    socket.emit('error_message', { message: 'Inquiry not found' });
                    return;
                }

                // Check ownership
                if (inquiry.owner.toString() !== socket.user.id) {
                    socket.emit('error_message', { message: 'Only the property owner can confirm the sale.' });
                    return;
                }

                // Update Inquiry status
                inquiry.status = 'PURCHASED';
                inquiry.closedAt = new Date();
                await inquiry.save();

                // Update Property status
                await Property.findByIdAndUpdate(inquiry.property._id, { status: 'SOLD' });

                // Save message
                const message = new ChatMessage({
                    inquiry: inquiryId,
                    sender: socket.user.id,
                    content: content || `I confirm the sale of this property.`,
                    messageType: 'PURCHASE_CONFIRMED'
                });
                await message.save();

                const messageData = {
                    type: 'CHAT_MESSAGE',
                    inquiryId,
                    message: {
                        ...message.toJSON(),
                        sender: {
                            id: socket.user.id,
                            firstName: socket.user.firstName,
                            lastName: socket.user.lastName
                        }
                    }
                };

                const statusData = {
                    type: 'STATUS_UPDATE',
                    inquiryId,
                    status: 'PURCHASED'
                };

                // Emit to both
                io.to(`user_${inquiry.client.toString()}`).emit('receive_message', messageData);
                io.to(`user_${inquiry.owner.toString()}`).emit('receive_message', messageData);
                io.to(`user_${inquiry.client.toString()}`).emit('status_update', statusData);
                io.to(`user_${inquiry.owner.toString()}`).emit('status_update', statusData);

                console.log(`[Socket] Sale confirmed for inquiry ${inquiryId} by owner ${socket.user.id}`);

            } catch (error) {
                console.error('Socket confirm_purchase error:', error);
                socket.emit('error_message', { message: 'Confirmation failed: ' + error.message });
            }
        });

        socket.on('send_document', async (data) => {
            try {
                const { inquiryId, fileUrl, message: content } = data;
                const inquiry = await PropertyInquiry.findById(inquiryId);
                if (!inquiry) return;

                const message = new ChatMessage({
                    inquiry: inquiryId,
                    sender: socket.user.id,
                    content: content || 'I have uploaded a document for verification.',
                    messageType: 'DOCUMENT',
                    attachmentUrl: fileUrl,
                    attachmentType: 'DOCUMENT'
                });
                await message.save();

                inquiry.documentStatus = 'PENDING';
                inquiry.documentUrl = fileUrl;
                await inquiry.save();

                const messageData = {
                    type: 'CHAT_MESSAGE',
                    inquiryId,
                    message: {
                        ...message.toJSON(),
                        sender: {
                            id: socket.user.id,
                            firstName: socket.user.firstName,
                            lastName: socket.user.lastName
                        }
                    }
                };

                const statusData = {
                    type: 'STATUS_UPDATE',
                    inquiryId,
                    status: inquiry.status,
                    documentStatus: 'PENDING',
                    documentUrl: fileUrl
                };

                io.to(`user_${inquiry.client.toString()}`).emit('receive_message', messageData);
                io.to(`user_${inquiry.owner.toString()}`).emit('receive_message', messageData);
                io.to(`user_${inquiry.client.toString()}`).emit('status_update', statusData);
                io.to(`user_${inquiry.owner.toString()}`).emit('status_update', statusData);

            } catch (error) {
                console.error('Socket send_document error:', error);
            }
        });

        socket.on('document_decision', async (data) => {
            try {
                const { inquiryId, decision, message: content } = data; // decision: 'APPROVED' or 'REJECTED'
                const inquiry = await PropertyInquiry.findById(inquiryId);
                if (!inquiry) return;

                const message = new ChatMessage({
                    inquiry: inquiryId,
                    sender: socket.user.id,
                    content: content || `Your document has been ${decision.toLowerCase()}.`,
                    messageType: 'DOCUMENT_DECISION'
                });
                await message.save();

                inquiry.documentStatus = decision;
                await inquiry.save();

                const messageData = {
                    type: 'CHAT_MESSAGE',
                    inquiryId,
                    message: {
                        ...message.toJSON(),
                        sender: {
                            id: socket.user.id,
                            firstName: socket.user.firstName,
                            lastName: socket.user.lastName
                        }
                    }
                };

                const statusData = {
                    type: 'STATUS_UPDATE',
                    inquiryId,
                    status: inquiry.status,
                    documentStatus: decision
                };

                io.to(`user_${inquiry.client.toString()}`).emit('status_update', statusData);
                io.to(`user_${inquiry.owner.toString()}`).emit('status_update', statusData);

                console.log(`[Socket] Document ${decision} for inquiry ${inquiryId}`);

            } catch (error) {
                console.error('Socket document_decision error:', error);
            }
        });

        socket.on('typing', (data) => {
            const { inquiryId, isTyping } = data;
            // logic to find recipient... simplified: broadcast to room "inquiry_{id}" if we used inquiry rooms
            // For now, we need to know the recipient. 
            // This requires fetching the inquiry or having the client send recipientId.
            // Simplified: asking client to join inquiry room
            socket.to(`inquiry_${inquiryId}`).emit('typing', data);
        });

        // Client should join inquiry room when opening chat
        socket.on('join_chat', (inquiryId) => {
            socket.join(`inquiry_${inquiryId}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};
