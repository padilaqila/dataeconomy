import { create } from 'zustand';

const useUIStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));
    
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  // Dialog state (Confirm / Prompt)
  dialog: null, 
  
  showConfirm: (options) => {
    set({
      dialog: {
        type: 'confirm',
        title: options.title || 'Konfirmasi',
        message: options.message,
        confirmText: options.confirmText || 'Ya',
        cancelText: options.cancelText || 'Batal',
        onConfirm: () => {
          if (options.onConfirm) options.onConfirm();
          set({ dialog: null });
        },
        onCancel: () => {
          if (options.onCancel) options.onCancel();
          set({ dialog: null });
        }
      }
    });
  },

  showPrompt: (options) => {
    set({
      dialog: {
        type: 'prompt',
        title: options.title || 'Input',
        message: options.message,
        defaultValue: options.defaultValue || '',
        confirmText: options.confirmText || 'Simpan',
        cancelText: options.cancelText || 'Batal',
        onConfirm: (value) => {
          if (options.onConfirm) options.onConfirm(value);
          set({ dialog: null });
        },
        onCancel: () => {
          if (options.onCancel) options.onCancel();
          set({ dialog: null });
        }
      }
    });
  },

  closeDialog: () => set({ dialog: null })
}));

export default useUIStore;
