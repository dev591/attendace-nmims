import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, hoverEffect = false, onClick, ...props }) => {
    return (
        <div
            onClick={onClick}
            className={twMerge(
                'card-base',
                hoverEffect && 'card-hover cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
