import React, { useState, useEffect } from 'react';
import Input from './Input';

export default function CurrencyInput({ value, onChange, name, ...props }) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Memformat nilai yang masuk jika ada
    if (value !== undefined && value !== null && value !== '') {
      const numericString = String(value).replace(/[^0-9]/g, '');
      const formatted = numericString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Update local state for immediate feedback
    setDisplayValue(formatted);
    
    // Panggil onChange asli dengan mock event object yang isinya adalah angka mentah
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          value: rawValue,
          name: name || e.target.name
        }
      });
    }
  };

  return (
    <Input 
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      name={name}
      {...props}
    />
  );
}
