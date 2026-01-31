import React from 'react';

interface CardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  children,
  variant = 'default',
  className = '',
}) => {
  const baseStyles = 'rounded-lg p-6';
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-transparent border-2 border-gray-300',
    elevated: 'bg-white shadow-lg',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {children}
    </div>
  );
};

export default Card;
