import React from 'react';
import { useStore } from '../context/Store';
import Card from '../components/Card';

const Profile = () => {
    const { data } = useStore();
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Student Profile</h2>
            <Card>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold">
                        {data.currentUser?.name?.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">{data.currentUser?.name}</h3>
                        <p className="text-gray-500">{data.currentUser?.sapid}</p>
                        <p className="text-gray-500">{data.currentUser?.program} (Year {data.currentUser?.year})</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Profile;
