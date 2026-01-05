/* ADDED BY ANTI-GRAVITY */
import React from 'react';

// Using simple CSS animation instead of Framer Motion to keep deps light/non-destructive
// But ensuring it looks smooth.

const FloatingElements = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Circle 1 */}
            <div
                className="absolute top-[-50px] right-[-50px] w-64 h-64 rounded-full bg-nmims-primary opacity-5 blur-3xl animate-float-slow"
                style={{ animationDuration: '10s' }}
            ></div>

            {/* Circle 2 */}
            <div
                className="absolute bottom-[10%] left-[-20px] w-48 h-48 rounded-full bg-blue-500 opacity-5 blur-3xl animate-float-slower"
                style={{ animationDuration: '15s' }}
            ></div>
        </div>
    );
};

export default FloatingElements;
