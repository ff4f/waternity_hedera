import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive';
}

const Alert = ({ children, className = '', variant = 'default' }: AlertProps) => {
  const variantClasses = {
    default: 'border-gray-300 bg-white text-gray-900',
    destructive: 'border-red-300 bg-red-50 text-red-900'
  };
  
  return (
    <div className={`border rounded-lg p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDescription = ({ children, className = '' }: AlertDescriptionProps) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
};

interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

const AlertTitle = ({ children, className = '' }: AlertTitleProps) => {
  return (
    <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
      {children}
    </h5>
  );
};

export { Alert, AlertDescription, AlertTitle };