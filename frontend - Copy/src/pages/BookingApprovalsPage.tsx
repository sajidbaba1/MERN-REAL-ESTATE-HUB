import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Home, User, Calendar, DollarSign, MessageSquare, Bell, Filter, Plus, Loader2 } from 'lucide-react';

interface RentBooking {
  id: string;
  property: {
    id: string;
    title: string;
    address: string;
    images?: string[];
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: string;
  createdAt: string;
}

interface PgBooking {
  id: string;
  bed: {
    id: string;
    bedNumber: string;
    room: {
      property: {
        id: string;
        title: string;
        address: string;
      };
    };
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number;
  status: string;
  createdAt: string;
}

interface ApprovalRequest {
  approvalMessage: string;
  finalMonthlyRent?: number;
  finalSecurityDeposit?: number;
}

interface RejectionRequest {
  rejectionReason: string;
}

const BookingApprovalsPage: React.FC = () => {
  const [rentBookings, setRentBookings] = useState<RentBooking[]>([]);
  const [pgBookings, setPgBookings] = useState<PgBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'rent' | 'pg'>('all');

  const RAW_BASE = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8889';
  const base = (RAW_BASE as string).replace(/\/+$/, '');
  const apiBase = base.endsWith('/api') ? base : `${base}/api`;

  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookingType, setBookingType] = useState<'rent' | 'pg'>('rent');

  // Form states
  const [approvalForm, setApprovalForm] = useState<ApprovalRequest>({
    approvalMessage: '',
    finalMonthlyRent: undefined,
    finalSecurityDeposit: undefined,
  });
  const [rejectionForm, setRejectionForm] = useState<RejectionRequest>({
    rejectionReason: '',
  });

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view booking approvals');
        return;
      }

      const response = await fetch(`${apiBase}/booking-management/pending-approvals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError('You are not authorized to view booking approvals');
          return;
        }
        throw new Error('Failed to load pending approvals');
      }

      const data = await response.json();
      setRentBookings(data.rentBookings || []);
      setPgBookings(data.pgBookings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const handleApprove = async () => {
    if (!selectedBooking) return;

    try {
      setProcessingBookingId(selectedBooking.id);
      const token = localStorage.getItem('token');

      const endpoint = bookingType === 'rent'
        ? `/booking-management/rent/${selectedBooking.id}/approve`
        : `/booking-management/pg/${selectedBooking.id}/approve`;

      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalForm),
      });

      if (!response.ok) {
        throw new Error('Failed to approve booking');
      }

      alert('Booking approved successfully!');
      setApprovalForm({
        approvalMessage: '',
        finalMonthlyRent: undefined,
        finalSecurityDeposit: undefined,
      });
      setShowApprovalModal(false);
      setSelectedBooking(null);
      await loadPendingApprovals();
    } catch (err: any) {
      alert(err.message || 'Failed to approve booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || !rejectionForm.rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingBookingId(selectedBooking.id);
      const token = localStorage.getItem('token');

      const endpoint = bookingType === 'rent'
        ? `/booking-management/rent/${selectedBooking.id}/reject`
        : `/booking-management/pg/${selectedBooking.id}/reject`;

      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionForm),
      });

      if (!response.ok) {
        throw new Error('Failed to reject booking');
      }

      alert('Booking rejected.');
      setRejectionForm({ rejectionReason: '' });
      setShowRejectionModal(false);
      setSelectedBooking(null);
      await loadPendingApprovals();
    } catch (err: any) {
      alert(err.message || 'Failed to reject booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const openApprovalModal = (booking: any, type: 'rent' | 'pg') => {
    setSelectedBooking(booking);
    setBookingType(type);
    setApprovalForm({
      approvalMessage: '',
      finalMonthlyRent: booking.monthlyRent,
      finalSecurityDeposit: booking.securityDeposit,
    });
    setShowApprovalModal(true);
  };

  const openRejectionModal = (booking: any, type: 'rent' | 'pg') => {
    setSelectedBooking(booking);
    setBookingType(type);
    setRejectionForm({ rejectionReason: '' });
    setShowRejectionModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredRentBookings = filter === 'pg' ? [] : rentBookings;
  const filteredPgBookings = filter === 'rent' ? [] : pgBookings;
  const totalPending = filteredRentBookings.length + filteredPgBookings.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-20 px-4 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-card">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={loadPendingApprovals} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Approvals</h1>
            <p className="text-gray-600 mt-1">Review and manage tenant booking requests.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="rent">Rentals</option>
              <option value="pg">PG Beds</option>
            </select>
          </div>
        </div>

        {totalPending === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">All caught up!</h3>
            <p className="text-gray-600">No pending booking approvals to review right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rent Bookings */}
            {filteredRentBookings.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary-600" /> Rental Properties
                </h2>
                {filteredRentBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100 hover:border-primary-200 transition-colors">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">{b.property.title}</h4>
                          <p className="text-sm text-gray-500">{b.property.address}</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase tracking-wider">Pending</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Tenant</p>
                          <p className="font-semibold">{b.tenant.firstName} {b.tenant.lastName}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Rent / Mo</p>
                          <p className="font-semibold text-primary-600">{formatCurrency(b.monthlyRent)}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => openApprovalModal(b, 'rent')} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">Approve</button>
                        <button onClick={() => openRejectionModal(b, 'rent')} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PG Bookings */}
            {filteredPgBookings.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary-600" /> PG Accommodations
                </h2>
                {filteredPgBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100 hover:border-primary-200 transition-colors">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">{b.bed.room.property.title}</h4>
                          <p className="text-sm text-gray-500">Bed {b.bed.bedNumber}</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase tracking-wider">Pending</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Tenant</p>
                          <p className="font-semibold">{b.tenant.firstName} {b.tenant.lastName}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Rent / Mo</p>
                          <p className="font-semibold text-primary-600">{formatCurrency(b.monthlyRent)}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => openApprovalModal(b, 'pg')} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">Approve</button>
                        <button onClick={() => openRejectionModal(b, 'pg')} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showApprovalModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowApprovalModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Confirm Approval</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monthly Rent</label>
                  <input type="number" value={approvalForm.finalMonthlyRent} onChange={e => setApprovalForm(f => ({ ...f, finalMonthlyRent: Number(e.target.value) }))} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Security Deposit</label>
                  <input type="number" value={approvalForm.finalSecurityDeposit} onChange={e => setApprovalForm(f => ({ ...f, finalSecurityDeposit: Number(e.target.value) }))} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Approval message</label>
                  <textarea value={approvalForm.approvalMessage} onChange={e => setApprovalForm(f => ({ ...f, approvalMessage: e.target.value }))} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" rows={2} placeholder="Optional welcome message..." />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowApprovalModal(false)} className="flex-1 py-2 font-bold text-gray-500">Cancel</button>
                <button onClick={handleApprove} className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold">Confirm Approve</button>
              </div>
            </motion.div>
          </div>
        )}

        {showRejectionModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRejectionModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4 text-red-600">Reject Request</h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for rejection *</label>
                <textarea required value={rejectionForm.rejectionReason} onChange={e => setRejectionForm(f => ({ ...f, rejectionReason: e.target.value }))} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500" rows={3} placeholder="Tell the tenant why..." />
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowRejectionModal(false)} className="flex-1 py-2 font-bold text-gray-500">Cancel</button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionForm.rejectionReason.trim()}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingApprovalsPage;

const Loader2Component = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
