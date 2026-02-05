
import React, { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';

// A simple HOC/Wrapper to handle route transitions
const PageTransition = ({ children }) => {
    const location = useLocation();
    const el = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // "Magical" Entrance: Simple Fade Up + subtle scale
            gsap.fromTo(el.current,
                { opacity: 0, y: 20, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out", delay: 0.1 }
            );
        }, el);
        return () => ctx.revert();
    }, [location.pathname]); // Re-run on route change

    return (
        <div ref={el} className="page-transition-container w-full h-full">
            {children}
        </div>
    );
};

export default PageTransition;
