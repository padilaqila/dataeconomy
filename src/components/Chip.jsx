import React from 'react';

export default function Chip({ children, variant = 'default', active = false, className = '', ...props }) {
  const variants = {
    filter: `border-[2px] border-black px-[12px] py-[4px] uppercase tracking-[1px] text-[10px] font-bold ${active ? 'bg-black text-white' : 'bg-white text-black'} cursor-pointer hover:bg-black hover:text-white transition-colors`,
    status_active: "border-[2px] border-[#008000] bg-white text-[#008000] px-[10px] py-[2px] text-[11px] font-semibold uppercase tracking-[1px]",
    status_warning: "border-[2px] border-[#FFA500] bg-white text-[#FFA500] px-[10px] py-[2px] text-[11px] font-semibold uppercase tracking-[1px]",
    status_error: "border-[2px] border-[#FF0000] bg-white text-[#FF0000] px-[10px] py-[2px] text-[11px] font-semibold uppercase tracking-[1px]",
    status_default: "border-[2px] border-black bg-white text-black px-[10px] py-[2px] text-[11px] font-semibold uppercase tracking-[1px]"
  };

  const vClass = variant === 'filter' ? variants.filter : variants[`status_${variant}`] || variants.status_default;

  return (
    <span className={`inline-flex items-center justify-center ${vClass} ${className}`} {...props}>
      {children}
    </span>
  );
}
