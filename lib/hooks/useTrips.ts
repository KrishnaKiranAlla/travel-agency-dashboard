import { useState, useEffect } from 'react';
import {
    collection,
    onSnapshot,
    query,
    DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';

export function useTrips() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen to all daily documents
        // This reads all docs in 'trips' collection. 
        // Optimization: potentially limit to recent months if data grows large.
        const q = query(collection(db, 'trips'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let allTrips: Trip[] = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (Array.isArray(data.trips)) {
                    allTrips = [...allTrips, ...data.trips];
                }
            });

            // Sort desc by time
            allTrips.sort((a, b) => {
                const timeA = a.tripDate?.seconds || 0;
                const timeB = b.tripDate?.seconds || 0;
                return timeB - timeA;
            });

            setTrips(allTrips);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching trips:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { trips, loading };
}
