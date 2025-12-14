import { Timestamp } from 'firebase/firestore';

export interface Vehicle {
    id: string;
    numberPlate: string;
    type: string;
    seats: number;
    ac: boolean;
    ownerType: 'self' | 'vendor';
    fuelType: string;
    status: 'active' | 'inactive';
    insuranceExpiry?: Timestamp | null;
    permitExpiry?: Timestamp | null;
}

export interface Trip {
    id: string;
    vehicleId: string;
    tripDate: Timestamp;
    pickupLocation: string;
    dropLocation: string;
    tripType: 'local' | 'outstation' | 'airport';
    estimatedKms?: number;
    estimatedHours?: number;
    baseRate: number;
    extraCharges?: number;
    totalAmount: number;
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    paymentMode?: 'cash' | 'upi' | 'bank';
    status: 'new' | 'scheduled' | 'running' | 'completed' | 'cancelled';
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
