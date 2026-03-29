'use client';

import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {createSession} from '@/lib/session';

export default function HomePage() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const initSession = async () => {
            setIsCreating(true);
            try {
                const sessionId = await createSession();
                router.push(`/session/${sessionId}`);
            } catch (error) {
                console.error('Failed to create session:', error);
                setIsCreating(false);
            }
        };

        initSession();
    }, [router]);

    return (
        <div
            className="min-h-screen bg-[#0d0d0d] flex items-center justify-center"
            style={{fontFamily: "'DM Mono', monospace"}}
        >
            <div className="text-center">
                <div
                    className="text-4xl font-extrabold mb-3 tracking-tight"
                    style={{fontFamily: "'Syne', sans-serif"}}
                >
                    <span className="text-[#c8f060]">Split</span>
                    <span className="text-[#f0f0f0]">ly</span>
                </div>
                <div className="text-sm text-[#666] animate-pulse">
                    {isCreating ? 'Creating your session...' : 'Initializing...'}
                </div>
            </div>
        </div>
    );
}
