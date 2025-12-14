'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/lib/hooks/useAuth';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth(true);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)'
            }}>
                Loading...
            </div>
        );
    }

    if (!user) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
            <Sidebar />
            <main style={{
                marginLeft: '260px',
                flex: 1,
                padding: '2rem',
                width: 'calc(100% - 260px)'
            }}>
                <div className="container">
                    {children}
                </div>
            </main>
        </div>
    );
}
