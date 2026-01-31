import React from 'react';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  size = 'medium',
  disabled = false,
  error,
  className = '',
}) => {
  const sizeStyles = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-3 py-2 text-base',
    large: 'px-4 py-3 text-lg',
  };

  const baseStyles = 'rounded border focus:outline-none focus:ring-2';
  const stateStyles = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:ring-blue-500';
  const disabledStyles = disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${baseStyles} ${sizeStyles[size]} ${stateStyles} ${disabledStyles} ${className}`}
      />
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
};

export default Input;
