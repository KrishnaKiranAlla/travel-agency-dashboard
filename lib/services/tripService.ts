import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';

const COLLECTION_NAME = 'trips';

export const getTrips = async (): Promise<Trip[]> => {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
    // Sort by date desc in JS to avoid index issues
    return trips.sort((a, b) => {
        const timeA = a.tripDate?.seconds || 0;
        const timeB = b.tripDate?.seconds || 0;
        return timeB - timeA;
    });
};

export const addTrip = async (trip: any) => {
    const data = {
        ...trip,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };
    return await addDoc(collection(db, COLLECTION_NAME), data);
};

export const updateTrip = async (id: string, trip: Partial<Trip>) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const data = {
        ...trip,
        updatedAt: Timestamp.now()
    };
    return await updateDoc(docRef, data);
};

export const deleteTrip = async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(docRef);
};
