import React from 'react';

const SimulatorSlider = ({ value, onChange, label, min = 0, max = 10, className = "text-gray-900" }) => {
    return (
        <div className="w-full">
            <div className={`flex justify-between mb-2 text-sm ${className}`}>
                <span className="opacity-80">{label}</span>
                <span className="font-bold">{value} classes</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer focus:outline-none accent-white"
                style={{ colorScheme: 'dark' }}
            />
            <div className={`flex justify-between mt-1 text-[10px] ${className} opacity-60`}>
                <span>0</span>
                <span>{max}</span>
            </div>
        </div>
    );
};

export default SimulatorSlider;
