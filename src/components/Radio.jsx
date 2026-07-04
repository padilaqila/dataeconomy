import React from 'react';

export default function Radio({ label, className = '', ...props }) {
  return (
    <label className={`inline-flex items-center space-x-3 cursor-pointer min-h-[44px] ${className}`}>
      <input 
        type="radio" 
        className="appearance-none w-[20px] h-[20px] !rounded-full border-[3px] border-black bg-white checked:bg-white focus:border-[5px] focus:outline-none disabled:border-[#CCCCCC] disabled:bg-[#F5F5F5] cursor-pointer relative checked:after:content-[''] checked:after:absolute checked:after:left-[2.5px] checked:after:top-[2.5px] checked:after:w-[9px] checked:after:h-[9px] checked:after:bg-black checked:after:!rounded-full"
        {...props}
      />
      {label && <span className="font-['Work_Sans'] text-[16px] text-black select-none">{label}</span>}
    </label>
  );
}
