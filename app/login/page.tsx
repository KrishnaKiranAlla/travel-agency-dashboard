'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (err: any) {
            // Auto-register if user not found (Dev convenience for dummy creds)
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                    router.push('/dashboard');
                    return;
                } catch (createErr) {
                    console.error(createErr);
                }
            } else if (err.code === 'auth/configuration-not-found') {
                setError('Error: Authentication not configured in Firebase Console.');
            } else {
                setError('Invalid email or password.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Travel Admin</h1>
                    <p className={styles.subtitle}>Sign in to manage fleet and trips</p>
                </div>

                {error && (
                    <div className={styles.error}>
                        {error}
                        {error.includes("configuration") && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', textAlign: 'left' }}>
                                <strong>Config Error:</strong> Use Firebase Console to enable
                                "Email/Password" in Build &gt; Authentication &gt; Sign-in method.
                            </div>
                        )}
                    </div>
                )}

                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@example.com"
                />

                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                />

                <Button type="submit" fullWidth isLoading={loading}>
                    Sign In
                </Button>
            </form>
        </div>
    );
}
