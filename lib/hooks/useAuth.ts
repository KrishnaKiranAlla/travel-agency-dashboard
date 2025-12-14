import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function useAuth(requireAuth = true) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            setLoading(false);

            if (requireAuth && !authUser) {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [requireAuth, router]);

    return { user, loading };
}
