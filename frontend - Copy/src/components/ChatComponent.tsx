import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, DollarSign, CheckCircle, XCircle, Loader2, ShoppingCart, Paperclip, FileText, Download, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import webSocketService, { WebSocketMessage } from '../services/websocketService';

interface ChatMessage {
  id: string;
  content: string;
  messageType: string;
  priceAmount?: number;
  attachmentUrl?: string;
  attachmentType?: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
  };
  sentAt: string;
  isRead: boolean;
}

interface PropertyInquiry {
  id: string;
  status: string;
  agreedPrice?: number;
  offeredPrice?: number;
  documentStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

interface ChatComponentProps {
  inquiryId: string;
  inquiry: PropertyInquiry;
  messages: ChatMessage[];
  onMessagesUpdate?: (messages: ChatMessage[]) => void;
  onInquiryUpdate?: (inquiry: PropertyInquiry) => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  inquiryId,
  inquiry,
  messages: initialMessages,
  onMessagesUpdate,
  onInquiryUpdate
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [priceOffer, setPriceOffer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isClient = user?.id === inquiry.client.id;
  const isOwner = user?.id === inquiry.owner.id;
  const canSendMessages = inquiry.status !== 'PURCHASED' && inquiry.status !== 'CANCELLED' && inquiry.status !== 'CLOSED';
  const canMakePurchase = inquiry.status === 'AGREED' && isClient && (inquiry.documentStatus === 'APPROVED' || !inquiry.documentUrl);
  const canConfirmPurchase = inquiry.status === 'AGREED' && isOwner && (inquiry.documentStatus === 'APPROVED' || !inquiry.documentUrl);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket event handlers
  const handleNewMessage = useCallback((wsMessage: WebSocketMessage) => {
    if (wsMessage.inquiryId === inquiryId && wsMessage.message) {
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === wsMessage.message.id);
        if (!exists) {
          const m = [...prev, wsMessage.message];
          onMessagesUpdate?.(m);
          return m;
        }
        return prev;
      });
    }
  }, [inquiryId, onMessagesUpdate]);

  const handleTypingIndicator = useCallback((wsMessage: WebSocketMessage) => {
    if (wsMessage.inquiryId === inquiryId) {
      setOtherUserTyping(wsMessage.isTyping || false);
      if (wsMessage.isTyping) {
        setTimeout(() => setOtherUserTyping(false), 3000);
      }
    }
  }, [inquiryId]);

  const handleStatusUpdate = useCallback((wsMessage: WebSocketMessage) => {
    if (wsMessage.inquiryId === inquiryId) {
      onInquiryUpdate?.({
        ...inquiry,
        status: wsMessage.status || inquiry.status,
        documentStatus: (wsMessage.documentStatus as any) || inquiry.documentStatus,
        documentUrl: wsMessage.documentUrl || inquiry.documentUrl,
        offeredPrice: wsMessage.offeredPrice || inquiry.offeredPrice,
        agreedPrice: wsMessage.agreedPrice || inquiry.agreedPrice
      });
      fetchMessages();
    }
  }, [inquiryId, inquiry, onInquiryUpdate]);

  useEffect(() => {
    const unsubMsg = webSocketService.onMessage(handleNewMessage);
    const unsubTyping = webSocketService.onTyping(handleTypingIndicator);
    const unsubStatus = webSocketService.onStatus(handleStatusUpdate);
    const unsubConn = webSocketService.onConnectionChange(setConnected);
    setConnected(webSocketService.connected);
    if (webSocketService.connected) webSocketService.joinChat(inquiryId);
    return () => { unsubMsg(); unsubTyping(); unsubStatus(); unsubConn(); };
  }, [handleNewMessage, handleTypingIndicator, handleStatusUpdate, inquiryId]);

  const fetchMessages = async () => {
    try {
      const RAW_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8889/api';
      const base = RAW_BASE.replace(/\/+$/, '');
      const apiBase = base.endsWith('/api') ? base : `${base}/api`;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/inquiries/${inquiryId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        onMessagesUpdate?.(data.messages || []);
        if (data.inquiry) onInquiryUpdate?.(data.inquiry);
      }
    } catch (e) { console.error(e); }
  };

  const sendMessage = async (content: string, type = 'TEXT', amount?: number) => {
    if (!content.trim() || sending || !canSendMessages) return;
    setSending(true);
    try {
      const ok = webSocketService.sendMessage(inquiryId, content, type, amount);
      if (ok) { setNewMessage(''); setPriceOffer(''); }
      else {
        const RAW_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8889/api';
        const base = RAW_BASE.replace(/\/+$/, '');
        const apiBase = base.endsWith('/api') ? base : `${base}/api`;
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/inquiries/${inquiryId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, messageType: type, priceAmount: amount })
        });
        if (res.ok) { fetchMessages(); setNewMessage(''); setPriceOffer(''); }
      }
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  const handleTyping = () => {
    if (!isTyping) { setIsTyping(true); webSocketService.sendTypingIndicator(inquiryId, true); }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); webSocketService.sendTypingIndicator(inquiryId, false); }, 2000);
  };

  const getStaticUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const RAW_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8889/api';
    const base = RAW_BASE.replace(/\/+$/, '');
    const serverBase = base.endsWith('/api') ? base.slice(0, -4) : base;
    return serverBase + (path.startsWith('/') ? '' : '/') + path;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
  };

  const handleSendPriceOffer = () => {
    const amount = parseFloat(priceOffer);
    if (isNaN(amount) || amount <= 0) return;
    sendMessage(`${isClient ? 'Price Offer:' : 'Counter Offer:'} ₹${amount.toLocaleString()}`, isClient ? 'PRICE_OFFER' : 'PRICE_COUNTER', amount);
  };

  const handleAcceptOffer = () => {
    if (!inquiry.offeredPrice) return;
    if (!confirm(`Accept offer of ₹${inquiry.offeredPrice.toLocaleString()} and move to agreement?`)) return;
    sendMessage(`I accept your offer of ₹${inquiry.offeredPrice.toLocaleString()}.`, 'PRICE_ACCEPT', inquiry.offeredPrice);
  };

  const handleApproveForPayment = async () => {
    if (!confirm('Approve for final payment?')) return;
    try {
      const RAW_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8889/api';
      const base = RAW_BASE.replace(/\/+$/, '');
      const apiBase = base.endsWith('/api') ? base : `${base}/api`;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/inquiries/${inquiryId}/approve-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: inquiry.offeredPrice || inquiry.agreedPrice })
      });
      if (res.ok) { onInquiryUpdate?.(await res.json()); fetchMessages(); alert('Approved for payment.'); }
    } catch (e) { console.error(e); }
  };

  const handleProcessPayment = async () => {
    const p = inquiry.agreedPrice || inquiry.offeredPrice;
    if (!confirm(`Pay ₹${p?.toLocaleString()}?`)) return;
    try {
      const RAW_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8889/api';
      const base = RAW_BASE.replace(/\/+$/, '');
      const apiBase = base.endsWith('/api') ? base : `${base}/api`;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/inquiries/${inquiryId}/process-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { const d = await res.json(); onInquiryUpdate?.(d.inquiry); fetchMessages(); alert('Payment Successful!'); }
      else alert((await res.json()).message || 'Payment failed');
    } catch (e) { console.error(e); }
  };

  const handleConfirmPurchase = () => {
    if (!confirm('Directly confirm the sale?')) return;
    webSocketService.confirmPurchase(inquiryId, `Sale confirmed by Agent for ₹${inquiry.agreedPrice?.toLocaleString()}.`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || uploading) return;
    setUploading(true);
    try {
      const RAW_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8889/api';
      const base = RAW_BASE.replace(/\/+$/, '');
      const apiBase = base.endsWith('/api') ? base : `${base}/api`;
      const token = localStorage.getItem('token');
      const fd = new FormData(); fd.append('document', f);
      const r = await fetch(`${apiBase}/upload/document`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if (!r.ok) throw new Error('Upload failed');
      const d = await r.json();
      const sr = await fetch(`${apiBase}/inquiries/${inquiryId}/submit-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentUrl: d.fileUrl, message: `Uploaded: ${f.name}` })
      });
      if (sr.ok) { onInquiryUpdate?.(await sr.json()); fetchMessages(); alert('Uploaded!'); }
    } catch (err) { alert('Upload failed'); } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleDocAction = async (s: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Confirm ${s}?`)) return;
    try {
      const RAW_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8889/api';
      const base = RAW_BASE.replace(/\/+$/, '');
      const apiBase = base.endsWith('/api') ? base : `${base}/api`;
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/inquiries/${inquiryId}/verify-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s, message: `Docs ${s.toLowerCase()}` })
      });
      if (res.ok) { onInquiryUpdate?.(await res.json()); fetchMessages(); }
    } catch (e) { console.error(e); }
  };

  const getMsgIcon = (t: string) => {
    switch (t) {
      case 'PRICE_OFFER':
      case 'PRICE_COUNTER': return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'PRICE_ACCEPT': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'PRICE_REJECT': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PURCHASE_CONFIRMED': return <ShoppingCart className="w-4 h-4 text-purple-500" />;
      case 'DOCUMENT': return <FileText className="w-4 h-4 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white border rounded-2xl shadow-xl overflow-hidden font-sans">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 flex items-center justify-between shadow-lg z-10">
        <div>
          <h3 className="font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span className="w-2 h-8 bg-blue-500 rounded-full block mr-2" />
            Chat with {isClient ? inquiry.owner.firstName : inquiry.client.firstName}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${inquiry.status === 'PURCHASED' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>{inquiry.status}</span>
            {inquiry.agreedPrice && <span className="text-xs font-bold text-green-400">₹{inquiry.agreedPrice.toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">{connected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 custom-scrollbar">
        {messages.map((m) => {
          const mine = m.sender.id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-md border ${mine ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'}`}>
                <div className="flex items-center space-x-2 mb-1.5">
                  {getMsgIcon(m.messageType)}
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{m.sender.firstName} • {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm font-semibold leading-relaxed">{m.content}</p>
                {m.messageType === 'DOCUMENT' && m.attachmentUrl && (
                  <div className="mt-3 bg-black/5 rounded-xl p-4 flex items-center justify-between border border-black/5 hover:bg-black/10 transition-all group">
                    <div className="flex items-center space-x-3"><FileText className="w-6 h-6 text-orange-500" /> <div className="text-xs font-black uppercase tracking-tighter">Verification Doc</div></div>
                    <a href={getStaticUrl(m.attachmentUrl)} target="_blank" rel="noopener noreferrer" download className="p-2.5 bg-white/20 rounded-xl hover:bg-white/40 shadow-sm"><Download className="w-5 h-5" /></a>
                  </div>
                )}
                {m.priceAmount && <div className="mt-2.5 px-3 py-1.5 bg-black/10 rounded-lg font-black text-sm inline-block tracking-tighter">₹{m.priceAmount.toLocaleString()}</div>}
              </div>
            </div>
          );
        })}
        {otherUserTyping && <div className="flex items-center space-x-2 p-3"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" /> <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100" /></div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Bars */}
      <div className="border-t bg-white shadow-inner">
        {/* NEGOTIATION ACTIONS (Owner) */}
        {canSendMessages && isOwner && inquiry.status === 'NEGOTIATING' && inquiry.offeredPrice && (
          <div className="px-6 py-4 bg-blue-50/80 border-b flex items-center justify-between animate-in slide-in-from-bottom duration-300">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Client's Offer</span>
              <span className="text-xl font-black text-blue-900 tracking-tighter">₹{inquiry.offeredPrice.toLocaleString()}</span>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleAcceptOffer} className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 uppercase tracking-widest transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center">
                <Check className="w-4 h-4 mr-2" /> AGREE PRICE
              </button>
              <button onClick={() => sendMessage("I reject this price offer.", "PRICE_REJECT")} className="px-4 py-2.5 bg-white text-red-500 border border-red-100 text-xs font-black rounded-xl hover:bg-red-50 uppercase tracking-widest transition-all">Reject</button>
            </div>
          </div>
        )}

        {/* DOC VERIFICATION (Owner) */}
        {canSendMessages && isOwner && inquiry.documentStatus === 'PENDING' && (
          <div className="px-6 py-4 bg-orange-50/80 border-b flex justify-between items-center animate-in slide-in-from-bottom duration-300">
            <span className="text-[10px] font-black uppercase text-orange-800 tracking-widest">Action: Verify Docs</span>
            <div className="flex space-x-3">
              <button onClick={() => handleDocAction('APPROVED')} className="px-5 py-2.5 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 shadow-md uppercase tracking-widest">Approve</button>
              <button onClick={() => handleDocAction('REJECTED')} className="px-5 py-2.5 bg-red-600 text-white text-xs font-black rounded-xl hover:bg-red-700 shadow-md uppercase tracking-widest">Reject</button>
            </div>
          </div>
        )}

        {/* APPROVE PAYMENT (Owner) */}
        {canSendMessages && isOwner && (inquiry.documentStatus === 'APPROVED' || inquiry.documentStatus === 'NONE') &&
          inquiry.status !== 'AGREED' && inquiry.status !== 'PURCHASED' && (
            <div className="p-4 bg-gray-50">
              <button onClick={handleApproveForPayment} className="w-full py-3.5 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-xl transition-all flex items-center justify-center space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <span>APPROVE FOR FINAL PAYMENT</span>
              </button>
            </div>
          )}

        {/* CONFIRM SALE (Owner) */}
        {canConfirmPurchase && (
          <div className="p-4 bg-indigo-50">
            <button onClick={handleConfirmPurchase} className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center space-x-3">
              <ShoppingCart className="w-5 h-5" />
              <span>CONFIRM DIRECT SALE</span>
            </button>
          </div>
        )}

        {/* PAY (Client) */}
        {canMakePurchase && (
          <div className="p-4 bg-green-50 animate-pulse-subtle">
            <button onClick={handleProcessPayment} className="w-full py-4 bg-green-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-green-700 flex items-center justify-center space-x-3 shadow-2xl shadow-green-200 border-2 border-green-500">
              <DollarSign className="w-6 h-6" />
              <span className="text-sm">PAY ₹{inquiry.agreedPrice?.toLocaleString()} & CLOSE DEAL</span>
            </button>
          </div>
        )}

        {/* INPUT AREA */}
        {canSendMessages ? (
          <div className="p-6 space-y-4 bg-white border-t">
            <div className="flex space-x-3">
              <div className="relative flex-1 group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                <input type="number" value={priceOffer} onChange={e => setPriceOffer(e.target.value)} placeholder="Propose Value..." className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-black outline-none transition-all" />
              </div>
              <button onClick={handleSendPriceOffer} className="px-6 bg-gray-900 text-white text-[10px] font-black rounded-2xl hover:bg-black transition-all shadow-lg active:scale-95">{isClient ? 'OFFER' : 'COUNTER'}</button>
            </div>
            <div className="flex space-x-3">
              <input type="text" value={newMessage} onChange={e => { setNewMessage(e.target.value); handleTyping(); }} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Write your message..." className="flex-1 px-5 py-3.5 bg-gray-100 focus:bg-white border-2 border-transparent focus:border-gray-200 rounded-2xl text-sm font-semibold outline-none transition-all" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3.5 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-2xl transition-all"><Paperclip className="w-6 h-6" /></button>
              <button onClick={handleSendMessage} disabled={sending} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 hover:shadow-blue-200 active:scale-90 transition-all">
                {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10 bg-gray-50 flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] text-center">Inquiry Finalized & Closed</p>
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.png" />
    </div>
  );
};

export default ChatComponent;
