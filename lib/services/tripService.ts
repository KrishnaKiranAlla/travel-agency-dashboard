
import {
    collection,
    doc,
    updateDoc,
    setDoc,
    getDoc,
    arrayUnion,
    arrayRemove,
    Timestamp,
    getDocs // Needed for specific lookups if not using hook
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip } from '@/types';
import { format } from 'date-fns';

const COLLECTION_NAME = 'trips';

// Helper to get Doc ID from Date
const getDocId = (date: Date | Timestamp) => {
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return format(d, 'yyyy-MM-dd');
};

export const getTrips = async (): Promise<Trip[]> => {
    // Fallback for non-hook usage (e.g. initial report load)
    // But ideally use hooks.
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    let allTrips: Trip[] = [];
    snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.trips && Array.isArray(data.trips)) {
            allTrips = [...allTrips, ...data.trips];
        }
    });
    return allTrips.sort((a, b) => (b.tripDate?.seconds || 0) - (a.tripDate?.seconds || 0));
};

export const addTrip = async (trip: any) => {
    const newTrip = {
        ...trip,
        id: crypto.randomUUID(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    };

    // Determine document ID based on tripDate
    const docId = getDocId(newTrip.tripDate);
    const docRef = doc(db, COLLECTION_NAME, docId);

    // setDoc with merge handles both create-new-day and update-existing-day
    return await setDoc(docRef, {
        date: docId,
        trips: arrayUnion(newTrip)
    }, { merge: true });
};

export const updateTrip = async (id: string, updatedFields: Partial<Trip>) => {
    // This is tricky: we don't know the DATE (DocID) just from the ID easily 
    // without searching or passing the original date. 
    // Strategy: Pass the original trip's date to find the doc, or efficient search.
    // For MVP: We will scan. (Inefficient but robust if Date changes).
    // Better: We assume UI passes the full trip object or we find it first.

    // Optimization: If we have the full list in memory (client), we know the date.
    // But service functions should be stateless-ish.

    // Let's implement a read-modify-write pattern.
    // 1. Find the doc containing the trip.
    const allDocs = await getDocs(collection(db, COLLECTION_NAME));
    let targetDoc = null;
    let targetTrip = null;

    for (const doc of allDocs.docs) {
        const trips = doc.data().trips as Trip[];
        const found = trips.find(t => t.id === id);
        if (found) {
            targetDoc = doc;
            targetTrip = found;
            break;
        }
    }

    if (!targetDoc || !targetTrip) throw new Error("Trip not found");

    const docRef = doc(db, COLLECTION_NAME, targetDoc.id);
    const currentTrips = targetDoc.data().trips as Trip[];

    const newTrip = { ...targetTrip, ...updatedFields, updatedAt: Timestamp.now() };

    // If date changed, might need to move to another doc!
    const oldDocId = targetDoc.id;
    const newDocId = getDocId(newTrip.tripDate);

    if (oldDocId !== newDocId) {
        // 1. Remove from old doc
        await updateDoc(docRef, { trips: arrayRemove(targetTrip) });
        // 2. Add to new doc
        const newDocRef = doc(db, COLLECTION_NAME, newDocId);
        await setDoc(newDocRef, { date: newDocId, trips: arrayUnion(newTrip) }, { merge: true });
    } else {
        // Same doc, update array
        const newTripsList = currentTrips.map(t => t.id === id ? newTrip : t);
        await updateDoc(docRef, { trips: newTripsList });
    }
};

export const deleteTrip = async (id: string) => {
    // Find doc first
    const allDocs = await getDocs(collection(db, COLLECTION_NAME));
    for (const d of allDocs.docs) {
        const trips = d.data().trips as Trip[];
        const trip = trips.find(t => t.id === id);
        if (trip) {
            await updateDoc(doc(db, COLLECTION_NAME, d.id), {
                trips: arrayRemove(trip)
            });
            return;
        }
    }
};

