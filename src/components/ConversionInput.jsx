import React from 'react';
import CurrencyInput from './CurrencyInput';

export default function ConversionInput({ 
  label, 
  unitName = 'unit', 
  referencePrice = 0, 
  amountValue = '', 
  quantityValue = '', 
  onAmountChange, 
  onQuantityChange,
}) {
  
  const handleAmountChange = (e) => {
    const val = e.target.value;
    onAmountChange(val);
    
    if (referencePrice > 0 && val) {
      const numVal = parseInt(val, 10);
      if (!isNaN(numVal)) {
        const qty = numVal / referencePrice;
        onQuantityChange(parseFloat(qty.toFixed(2)).toString());
      }
    } else if (!val) {
      onQuantityChange('');
    }
  };

  const handleQuantityChange = (e) => {
    const val = e.target.value;
    onQuantityChange(val);
    
    if (referencePrice > 0 && val) {
      const numVal = parseFloat(val);
      if (!isNaN(numVal)) {
        const amt = Math.round(numVal * referencePrice);
        onAmountChange(amt.toString());
      }
    } else if (!val) {
      onAmountChange('');
    }
  };

  return (
    <div className="border-2 border-black p-4 mb-4 relative bg-gray-50">
      <div className="absolute top-0 left-0 bg-black text-white px-2 py-1 text-xs font-bold uppercase">
        {label}
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold mb-1 text-sm uppercase">Total Biaya (Rp)</label>
          <div className="flex">
            <div className="bg-gray-200 border-2 border-black border-r-0 px-3 flex items-center font-bold">
              Rp
            </div>
            <CurrencyInput 
              value={amountValue} 
              onChange={handleAmountChange}
              placeholder="0"
              className="w-full flex-grow border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
        <div>
          <label className="block font-bold mb-1 text-sm uppercase">Kuantitas ({unitName})</label>
          <div className="flex">
            <input 
              type="number"
              step="any"
              value={quantityValue}
              onChange={handleQuantityChange}
              placeholder="0"
              className="w-full flex-grow border-2 border-black p-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="bg-gray-200 border-2 border-black border-l-0 px-3 flex items-center font-bold uppercase text-xs">
              {unitName}
            </div>
          </div>
        </div>
      </div>
      {referencePrice > 0 ? (
        <div className="text-xs mt-3 text-gray-600 font-bold bg-yellow-100 p-2 border-l-4 border-yellow-500">
          💡 Konversi Otomatis Aktif (Harga Referensi: Rp {Number(referencePrice).toLocaleString('id-ID')}/{unitName})
        </div>
      ) : (
        <div className="text-xs mt-3 text-red-600 font-bold bg-red-50 p-2 border-l-4 border-red-500">
          ⚠️ Konversi tidak aktif karena Harga Referensi belum diisi.
        </div>
      )}
    </div>
  );
}
