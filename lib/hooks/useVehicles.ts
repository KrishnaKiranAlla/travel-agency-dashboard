import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Vehicle } from '@/types';

export function useVehicles() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'vehicles'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Vehicle));
            setVehicles(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching vehicles:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { vehicles, loading };
}
