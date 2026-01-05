/* ADDED BY ANTI-GRAVITY */
import React from 'react';

export default function BadgeCard({ badge, locked = false, onInfo }) {
    const style = { filter: locked ? 'blur(3px) grayscale(0.8)' : 'none', transition: 'filter .2s', opacity: locked ? 0.6 : 1 };

    // Using a fallback icon if image fails or path is relative without base
    // Assuming public/assets/badges/ exists, or we use a placehold
    const imgSrc = badge.icon && badge.icon.startsWith('/') ? badge.icon : '/assets/badges/default.svg';

    return (
        <div className="w-full p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group relative overflow-hidden">

            {/* Icon Area */}
            <div className="w-16 h-16 mb-3 relative flex items-center justify-center bg-gray-50 rounded-full p-2">
                {/* If SVG exists use img, else Lucide placeholder? For now assuming SVGs are set up as requested or won't load */}
                <img
                    src={imgSrc}
                    alt={badge.name}
                    style={style}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                {/* Fallback text icon if img fails */}
                <div style={{ display: 'none' }} className="absolute inset-0 flex items-center justify-center text-2xl">🏆</div>

                {locked && <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-gray-800/80 p-1.5 rounded-full text-white shadow-lg backdrop-blur-sm">
                        <span role="img" aria-label="locked">🔒</span>
                    </div>
                </div>}
            </div>

            <div className="font-bold text-gray-900 text-sm mb-1 leading-tight">{badge.name}</div>

            {badge.awarded_at ? (
                <div className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                    {new Date(badge.awarded_at).toLocaleDateString()}
                </div>
            ) : (
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Locked</div>
            )}

            <button className="absolute top-2 right-2 text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onInfo(badge); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </button>

            {/* Click entire card for info */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => onInfo(badge)}></div>
        </div>
    );
}
