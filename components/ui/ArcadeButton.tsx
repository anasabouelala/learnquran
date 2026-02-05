import React from 'react';

interface ArcadeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const ArcadeButton: React.FC<ArcadeButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative font-arcade uppercase transition-all duration-100 active:translate-y-1 border-b-4 rounded-xl focus:outline-none";
  
  const variants = {
    primary: "bg-arcade-cyan border-cyan-700 text-white hover:brightness-110 shadow-[0_0_15px_rgba(6,182,212,0.5)]",
    secondary: "bg-arcade-purple border-purple-900 text-white hover:brightness-110 shadow-[0_0_15px_rgba(107,33,168,0.5)]",
    danger: "bg-red-500 border-red-800 text-white hover:brightness-110",
    success: "bg-green-500 border-green-800 text-white hover:brightness-110"
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-lg w-full"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
