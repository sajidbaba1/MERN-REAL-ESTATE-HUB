import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  inquiryId?: string;
  message?: any;
  content?: string;
  priceAmount?: number;
  messageType?: string;
  senderName?: string;
  isTyping?: boolean;
  status?: string;
  documentStatus?: string;
  documentUrl?: string;
  offeredPrice?: number;
  agreedPrice?: number;
  notification?: any;
}

export interface MessageCallback {
  (message: WebSocketMessage): void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private token: string | null = null;
  private userId: string | null = null;

  // Callback handlers
  private messageCallbacks: MessageCallback[] = [];
  private notificationCallbacks: MessageCallback[] = [];
  private typingCallbacks: MessageCallback[] = [];
  private statusCallbacks: MessageCallback[] = [];
  private purchaseCallbacks: MessageCallback[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];

  connect(token: string, userId: string) {
    if (this.isConnected && this.token === token && this.userId === userId) {
      console.log('[WebSocket] Already connected with same credentials');
      return Promise.resolve();
    }

    this.token = token;
    this.userId = userId;

    const RAW_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8889';
    const base = RAW_BASE.replace(/\/+$/, '');
    // Remove /api suffix if present
    const serverBase = base.endsWith('/api') ? base.slice(0, -4) : base;

    console.log('[WebSocket] Connecting to:', serverBase);

    this.socket = io(serverBase, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.socket!.once('connect', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        console.log('[WebSocket] Connected successfully');
        this.notifyConnectionChange(true);

        // Join user's personal room
        this.socket!.emit('join_user', userId);

        resolve();
      });

      this.socket!.once('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('[WebSocket] Connection error:', error);
        reject(error);
      });
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.isConnected = true;
      this.notifyConnectionChange(true);

      // Rejoin user room on reconnect
      if (this.userId) {
        this.socket!.emit('join_user', this.userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    // Listen for messages
    this.socket.on('receive_message', (data: WebSocketMessage) => {
      console.log('[WebSocket] Received message:', data);
      this.notifyMessageCallbacks(data);
    });

    // Listen for status updates
    this.socket.on('status_update', (data: WebSocketMessage) => {
      console.log('[WebSocket] Received status update:', data);
      this.notifyStatusCallbacks(data);
      // Also notify as notification
      this.notifyNotificationCallbacks({
        ...data,
        type: 'INQUIRY_STATUS_CHANGE',
      });
    });

    // Listen for typing indicators
    this.socket.on('typing', (data: WebSocketMessage) => {
      console.log('[WebSocket] Received typing indicator:', data);
      this.notifyTypingCallbacks(data);
    });

    // Listen for purchase success
    this.socket.on('purchase_success', (data: any) => {
      console.log('[WebSocket] Purchase successful:', data);
      this.notifyPurchaseCallbacks({
        ...data,
        type: 'PURCHASE_SUCCESS',
      });
    });

    // Listen for notifications
    this.socket.on('notification', (data: any) => {
      console.log('[WebSocket] Received notification:', data);
      this.notifyNotificationCallbacks(data);
    });

    // Listen for new inquiries specifically
    this.socket.on('inquiry_new', (data: any) => {
      console.log('[WebSocket] Received new inquiry:', data);
      // Modern pages expect NEW_INQUIRY type
      this.notifyNotificationCallbacks({
        ...data,
        type: 'NEW_INQUIRY'
      });
    });

    // Listen for error messages
    this.socket.on('error_message', (data: any) => {
      console.error('[WebSocket] Error:', data);
      this.notifyNotificationCallbacks({
        type: 'ERROR',
        ...data
      });
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.token = null;
      this.userId = null;
      this.notifyConnectionChange(false);
    }
  }

  // Send message via WebSocket
  sendMessage(inquiryId: string, content: string, messageType = 'TEXT', priceAmount?: number) {
    if (!this.isConnected || !this.socket) {
      console.error('[WebSocket] Cannot send message - not connected');
      return false;
    }

    const message = {
      inquiryId,
      content,
      messageType,
      priceAmount
    };

    try {
      this.socket.emit('send_message', message);
      console.log('[WebSocket] Sent message:', message);
      return true;
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      return false;
    }
  }

  // Send typing indicator
  sendTypingIndicator(inquiryId: string, isTyping: boolean) {
    if (!this.isConnected || !this.socket) return false;

    try {
      this.socket.emit('typing', { inquiryId, isTyping });
      return true;
    } catch (error) {
      console.error('[WebSocket] Error sending typing indicator:', error);
      return false;
    }
  }

  // Send purchase request
  sendPurchaseRequest(inquiryId: string, finalPrice: number, message?: string) {
    if (!this.isConnected || !this.socket) return false;

    try {
      this.socket.emit('purchase_request', {
        inquiryId,
        finalPrice,
        message
      });
      console.log('[WebSocket] Sent purchase request');
      return true;
    } catch (error) {
      console.error('[WebSocket] Error sending purchase request:', error);
      return false;
    }
  }

  // Confirm purchase (owner)
  confirmPurchase(inquiryId: string, message?: string) {
    if (!this.isConnected || !this.socket) return false;

    try {
      this.socket.emit('confirm_purchase', {
        inquiryId,
        message
      });
      console.log('[WebSocket] Sent purchase confirmation');
      return true;
    } catch (error) {
      console.error('[WebSocket] Error sending purchase confirmation:', error);
      return false;
    }
  }

  // Join a chat room
  joinChat(inquiryId: string) {
    if (!this.isConnected || !this.socket) return false;

    try {
      this.socket.emit('join_chat', inquiryId);
      console.log('[WebSocket] Joined chat:', inquiryId);
      return true;
    } catch (error) {
      console.error('[WebSocket] Error joining chat:', error);
      return false;
    }
  }

  // Mark messages as read (if backend supports it)
  markMessagesAsRead(inquiryId: string) {
    if (!this.isConnected || !this.socket) return false;

    try {
      this.socket.emit('mark_read', { inquiryId });
      return true;
    } catch (error) {
      console.error('[WebSocket] Error marking messages as read:', error);
      return false;
    }
  }

  // Event handlers
  onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
    return () => {
      const index = this.messageCallbacks.indexOf(callback);
      if (index > -1) this.messageCallbacks.splice(index, 1);
    };
  }

  onNotification(callback: MessageCallback) {
    this.notificationCallbacks.push(callback);
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) this.notificationCallbacks.splice(index, 1);
    };
  }

  onTyping(callback: MessageCallback) {
    this.typingCallbacks.push(callback);
    return () => {
      const index = this.typingCallbacks.indexOf(callback);
      if (index > -1) this.typingCallbacks.splice(index, 1);
    };
  }

  onStatus(callback: MessageCallback) {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) this.statusCallbacks.splice(index, 1);
    };
  }

  onPurchase(callback: MessageCallback) {
    this.purchaseCallbacks.push(callback);
    return () => {
      const index = this.purchaseCallbacks.indexOf(callback);
      if (index > -1) this.purchaseCallbacks.splice(index, 1);
    };
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) this.connectionCallbacks.splice(index, 1);
    };
  }

  // Notify callbacks
  private notifyMessageCallbacks(message: WebSocketMessage) {
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('[WebSocket] Error in message callback:', error);
      }
    });
  }

  private notifyNotificationCallbacks(notification: WebSocketMessage) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('[WebSocket] Error in notification callback:', error);
      }
    });
  }

  private notifyTypingCallbacks(typing: WebSocketMessage) {
    this.typingCallbacks.forEach(callback => {
      try {
        callback(typing);
      } catch (error) {
        console.error('[WebSocket] Error in typing callback:', error);
      }
    });
  }

  private notifyStatusCallbacks(status: WebSocketMessage) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[WebSocket] Error in status callback:', error);
      }
    });
  }

  private notifyPurchaseCallbacks(purchase: WebSocketMessage) {
    this.purchaseCallbacks.forEach(callback => {
      try {
        callback(purchase);
      } catch (error) {
        console.error('[WebSocket] Error in purchase callback:', error);
      }
    });
  }

  private notifyConnectionChange(connected: boolean) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('[WebSocket] Error in connection callback:', error);
      }
    });
  }

  // Getters
  get connected() {
    return this.isConnected;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
