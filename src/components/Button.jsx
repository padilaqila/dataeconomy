import React from 'react';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  className = '', 
  disabled = false,
  ...props 
}) {
  const baseClasses = "uppercase tracking-widest font-semibold transition-colors flex items-center justify-center select-none";
  
  const variants = {
    primary: "bg-black text-white border-[3px] border-black hover:bg-white hover:text-black active:bg-black active:text-white active:border-[5px]",
    secondary: "bg-white text-black border-[3px] border-black hover:bg-black hover:text-white active:border-[5px]",
    ghost: "bg-transparent text-black border-none hover:text-[#0000FF] underline active:text-[#0000FF]",
    destructive: "bg-[#FF0000] text-white border-[3px] border-black hover:bg-black hover:text-[#FF0000] active:border-[5px]"
  };

  const sizes = {
    small: "text-[12px] h-[32px] px-4",
    medium: "text-[14px] min-h-[44px] px-6",
    large: "text-[18px] min-h-[56px] px-10"
  };

  const disabledClasses = "bg-[#F0F0F0] text-[#CCCCCC] border-[3px] border-[#CCCCCC] cursor-not-allowed pointer-events-none";

  const variantClass = disabled ? disabledClasses : variants[variant];
  
  return (
    <button 
      className={`${baseClasses} ${variantClass} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
