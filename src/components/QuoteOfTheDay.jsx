/* ADDED BY ANTI-GRAVITY */
import React from "react";
import { getQuoteOfTheDay } from "../lib/theme";

export default function QuoteOfTheDay({ program }) {
    const q = getQuoteOfTheDay(program) || { text: "", author: "" };
    if (!q.text) return null;

    return (
        <div className="glass-card p-4 mb-4 flex items-start gap-3 relative overflow-hidden">
            <div className="text-3xl leading-none opacity-50 font-serif text-nmims-primary">“</div>
            <div className="relative z-10">
                <div className="text-base font-medium italic opacity-90">{q.text}</div>
                <div className="text-xs mt-2 font-bold opacity-70 uppercase tracking-wider">— {q.author}</div>
            </div>
        </div>
    );
}
