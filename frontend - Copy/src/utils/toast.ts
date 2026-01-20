import toast from 'react-hot-toast';

export const showToast = {
    success: (message: string) => {
        toast.success(message, {
            style: {
                background: '#10b981',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
            },
        });
    },

    error: (message: string) => {
        toast.error(message, {
            style: {
                background: '#ef4444',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
            },
        });
    },

    info: (message: string) => {
        toast(message, {
            icon: 'ℹ️',
            style: {
                background: '#3b82f6',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
            },
        });
    },

    warning: (message: string) => {
        toast(message, {
            icon: '⚠️',
            style: {
                background: '#f59e0b',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
            },
        });
    },

    loading: (message: string) => {
        return toast.loading(message, {
            style: {
                background: '#6b7280',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
            },
        });
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return toast.promise(promise, messages, {
            style: {
                padding: '16px',
                borderRadius: '8px',
            },
        });
    },
};

export default showToast;
