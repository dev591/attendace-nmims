import React from 'react';

const Heatmap = ({ data }) => {
    const getColor = (status) => {
        switch (status) {
            case 'present': return 'bg-status-good';
            case 'absent': return 'bg-status-danger';
            default: return 'bg-gray-200';
        }
    };

    return (
        <div className="flex gap-1 justify-between">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-full aspect-square rounded-sm ${getColor(d.status)} opacity-80`}></div>
                    <span className="text-[10px] text-gray-500 font-bold">{d.day}</span>
                </div>
            ))}
        </div>
    );
};

export default Heatmap;
