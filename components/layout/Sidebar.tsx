'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Car, Map, BarChart3, LogOut, Hexagon, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const menu = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Vehicles', href: '/vehicles', icon: Car },
        { name: 'Trips', href: '/trips', icon: Map },
        { name: 'Revenue', href: '/revenue', icon: BarChart3 },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
    ];

    const closeMobile = () => setIsMobileOpen(false);

    return (
        <>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button
                    className={styles.menuBtn}
                    onClick={() => setIsMobileOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>
                <div className={styles.logo} style={{ flex: 1, justifyContent: 'center', marginBottom: 0 }}>
                    <Hexagon size={24} fill="var(--color-primary)" stroke="none" />
                    <span>TravelAdmin</span>
                </div>
                <div style={{ width: 40 }} /> {/* Spacer for centering */}
            </header>

            {/* Overlay */}
            <div
                className={`${styles.overlay} ${isMobileOpen ? styles.overlayVisible : ''}`}
                onClick={closeMobile}
            />

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className={styles.logo}>
                        <Hexagon size={28} fill="var(--color-primary)" stroke="none" />
                        <span>TravelAdmin</span>
                    </div>
                    <button
                        className={`${styles.menuBtn} hide-desktop`}
                        onClick={closeMobile}
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    {menu.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.link} ${isActive ? styles.active : ''}`}
                                onClick={closeMobile}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.footer}>
                    <button onClick={handleLogout} className={styles.logout}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
