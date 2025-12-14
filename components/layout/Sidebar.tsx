'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Car, Map, BarChart3, LogOut, Hexagon } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

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
        { name: 'Reports', href: '/reports', icon: BarChart3 },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <Hexagon size={32} fill="var(--color-primary)" stroke="none" />
                <span>TravelAdmin</span>
            </div>

            <nav className={styles.nav}>
                {menu.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.link} ${isActive ? styles.active : ''}`}
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
    );
}
