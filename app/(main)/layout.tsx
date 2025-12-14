'use client';

import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/lib/hooks/useAuth';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth(true);

    if (loading) {
        return (
            <div className="loading-container" style={{ height: '100vh' }}>
                Loading...
            </div>
        );
    }

    if (!user) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
            <Sidebar />
            <main className="main-content">
                <div className="container">
                    {children}
                </div>
            </main>
            <style jsx>{`
        .main-content {
          margin-left: 260px;
          flex: 1;
          padding: 2rem;
          width: calc(100% - 260px);
        }
        
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            width: 100%;
            padding: 1rem;
            padding-top: calc(60px + 1rem);
          }
        }
      `}</style>
        </div>
    );
}
