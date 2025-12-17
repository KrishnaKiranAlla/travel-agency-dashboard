'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Car, Map, BarChart3, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import styles from './DashboardHeader.module.css';

export default function DashboardHeader() {
    const router = useRouter();
    const pathname = usePathname();

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

    return (
        <div className={styles.header}>
            <nav className={styles.nav}>
                {menu.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            title={item.name}
                        >
                            <Icon size={20} strokeWidth={2} className="icon" />
                            <span className={styles.label}>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
            <button
                onClick={handleLogout}
                className={styles.logoutBtn}
                title="Logout"
            >
                <LogOut size={18} strokeWidth={2} className="icon" />
                <span className={styles.label}>Logout</span>
            </button>
        </div>
    );
}
