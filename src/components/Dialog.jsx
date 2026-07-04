import React, { useState, useEffect } from 'react';
import useUIStore from '../stores/uiStore';
import Button from './Button';

export default function Dialog() {
  const dialog = useUIStore((state) => state.dialog);
  const closeDialog = useUIStore((state) => state.closeDialog);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (dialog && dialog.type === 'prompt') {
      setInputValue(dialog.defaultValue || '');
    }
  }, [dialog]);

  if (!dialog) return null;

  const handleConfirm = () => {
    if (dialog.type === 'prompt') {
      dialog.onConfirm(inputValue);
    } else {
      dialog.onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-white border-[5px] border-black w-full max-w-md shadow-[8px_8px_0_0_#000]">
        <div className="bg-black text-white px-4 py-3 border-b-[5px] border-black">
          <h3 className="font-['Archivo_Black'] text-xl uppercase tracking-wider">{dialog.title}</h3>
        </div>
        
        <div className="p-5">
          <p className="font-['Space_Mono'] text-sm md:text-base mb-5 whitespace-pre-wrap">
            {dialog.message}
          </p>

          {dialog.type === 'prompt' && (
            <input
              type="text"
              autoFocus
              className="w-full font-['Space_Mono'] text-base border-[3px] border-black p-3 outline-none focus:bg-gray-100 transition-colors mb-5"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') dialog.onCancel();
              }}
            />
          )}

          <div className="flex space-x-3">
            <Button
              className="flex-1"
              variant="secondary"
              onClick={dialog.onCancel}
            >
              {dialog.cancelText}
            </Button>
            <Button
              className="flex-1"
              variant={dialog.title.toLowerCase().includes('peringatan') || dialog.title.toLowerCase().includes('hapus') ? 'destructive' : 'primary'}
              onClick={handleConfirm}
            >
              {dialog.confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
