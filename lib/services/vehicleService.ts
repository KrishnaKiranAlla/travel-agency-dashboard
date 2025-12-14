import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Vehicle } from '@/types';

const COLLECTION_NAME = 'vehicles';

export const getVehicles = async (): Promise<Vehicle[]> => {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
};

export const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    return await addDoc(collection(db, COLLECTION_NAME), vehicle);
};

export const updateVehicle = async (id: string, vehicle: Partial<Vehicle>) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, vehicle);
};

export const deleteVehicle = async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(docRef);
};
