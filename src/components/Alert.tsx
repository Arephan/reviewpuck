import React from 'react';

interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
}) => {
  const styles = {
    success: 'bg-green-50 border-green-500 text-green-900',
    error: 'bg-red-50 border-red-500 text-red-900',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
    info: 'bg-blue-50 border-blue-500 text-blue-900',
  };

  return (
    <div className={`border-l-4 p-4 ${styles[type]}`}>
      {title && <h4 className="font-bold mb-1">{title}</h4>}
      <p>{message}</p>
    </div>
  );
};

export default Alert;
