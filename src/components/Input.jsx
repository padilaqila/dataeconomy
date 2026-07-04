import React from 'react';

export default function Input({ label, helperText, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && <label className="font-['Archivo_Black'] text-sm uppercase block mb-1 text-black">{label}</label>}
      <input 
        className={`
          font-['Space_Mono'] bg-[#F0F0F0] text-black border-[3px] 
          px-3 py-2 text-[15px] transition-colors w-full outline-none min-h-[44px]
          hover:bg-[#E8E8E8] focus:border-[5px] focus:bg-white focus:px-[10px] focus:py-[7px]
          disabled:border-[#CCCCCC] disabled:bg-[#F5F5F5] disabled:cursor-not-allowed
          ${error ? 'border-[#FF0000]' : 'border-black'}
        `}
        {...props}
      />
      {helperText && (
        <span className={`font-['Work_Sans'] text-[12px] mt-1 ${error ? 'text-[#FF0000]' : 'text-gray-600'}`}>
          {helperText}
        </span>
      )}
    </div>
  );
}
