import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/Store';
import { Calendar, Clock } from 'lucide-react';

const MyEvents = () => {
    const { api } = useStore();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/events/my')
            .then(res => setEvents(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [api]);

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8 animate-fade-in">
            <h1 className="text-2xl font-bold mb-6">My Event Requests</h1>

            {loading ? <div className="text-center py-20">Loading...</div> : (
                <div className="space-y-4">
                    {events.length === 0 && <p className="text-slate-500">No events found.</p>}
                    {events.map(evt => (
                        <div key={evt.event_id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">{evt.title}</h3>
                                <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                                    <Calendar size={14} /> {new Date(evt.date).toLocaleDateString()}
                                    <Clock size={14} /> {evt.start_time}
                                </p>
                            </div>
                            <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${evt.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        evt.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {evt.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyEvents;
