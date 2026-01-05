import React from 'react';
import { twMerge } from 'tailwind-merge';

const Button = ({ children, variant = 'primary', className, ...props }) => {
    const variants = {
        primary: 'btn-primary shadow-sm',
        secondary: 'btn-secondary',
        ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    };

    return (
        <button
            className={twMerge(
                'flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 px-4 py-2 rounded-md font-medium text-sm',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
