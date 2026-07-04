import React from 'react';

export default function Card({ children, elevated = false, className = '', ...props }) {
  return (
    <div 
      className={`bg-white border-black p-6 ${elevated ? 'border-[5px]' : 'border-[3px]'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
