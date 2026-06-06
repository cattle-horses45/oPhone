import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export default function Input({
  label,
  error,
  helpText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#5F6B7A] mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2 border rounded-md text-sm
          transition-colors duration-200
          bg-white text-[#15181B]
          focus:outline-none focus:ring-2 focus:ring-[#3D6A94]/20 focus:border-[#3D6A94]
          placeholder:text-[#8B95A5]
          disabled:bg-gray-50 disabled:text-gray-400
          ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-200'}
          ${className}
        `.trim()}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {helpText && !error && (
        <p className="mt-1 text-xs text-[#8B95A5]">{helpText}</p>
      )}
    </div>
  );
}
