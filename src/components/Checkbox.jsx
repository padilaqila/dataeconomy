import React from 'react';

export default function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`inline-flex items-center space-x-3 cursor-pointer min-h-[44px] ${className}`}>
      <input 
        type="checkbox" 
        className="appearance-none w-[20px] h-[20px] border-[3px] border-black bg-white checked:bg-black focus:border-[5px] focus:outline-none disabled:border-[#CCCCCC] disabled:bg-[#F5F5F5] cursor-pointer relative checked:after:content-[''] checked:after:absolute checked:after:left-[4px] checked:after:top-[1px] checked:after:w-[6px] checked:after:h-[10px] checked:after:border-white checked:after:border-b-[3px] checked:after:border-r-[3px] checked:after:rotate-45"
        {...props}
      />
      {label && <span className="font-['Work_Sans'] text-[16px] text-black select-none">{label}</span>}
    </label>
  );
}
