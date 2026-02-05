import React, { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SmoothScroll = ({ children }) => {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
        });

        const lenisRaf = (time) => {
            lenis.raf(time);
        };

        const gsapRaf = (time) => {
            lenis.raf(time * 1000);
        };

        // Sync GSAP Ticker with Lenis
        gsap.ticker.add(gsapRaf);

        // Use requestAnimationFrame for Lenis itself if not driven by GSAP ticker exclusively
        // But here we rely on GSAP ticker for sync.
        // Actually, standard practice is rAF loop OR GSAP ticker. 
        // Let's stick to the method that ensures ScrollTrigger sync.

        // lenis.on('scroll', ScrollTrigger.update); // Sync ScrollTrigger on scroll

        // IMPORTANT: We need to ensure Lenis runs.
        // The previous implementation in Home.jsx used a rAF loop.
        // Let's use the GSAP ticker method which is robust for ScrollTrigger.

        gsap.ticker.lagSmoothing(0); // Disable lag smoothing for smooth scroll

        return () => {
            lenis.destroy();
            gsap.ticker.remove(gsapRaf);
        };
    }, []);

    return <div className="smooth-scroll-wrapper">{children}</div>;
};

export default SmoothScroll;
