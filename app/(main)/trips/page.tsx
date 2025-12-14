'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Trip, Vehicle } from '@/types';
import { getTrips, addTrip, updateTrip, deleteTrip } from '@/lib/services/tripService';
import { getVehicles } from '@/lib/services/vehicleService';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export default function TripsPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTrip, setCurrentTrip] = useState<any>({});
    const [isEditing, setIsEditing] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tripsData, vehiclesData] = await Promise.all([getTrips(), getVehicles()]);
            setTrips(tripsData);
            setVehicles(vehiclesData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtered trips
    const filteredTrips = trips.filter(trip => {
        if (filterStatus && trip.status !== filterStatus) return false;
        if (filterVehicle && trip.vehicleId !== filterVehicle) return false;
        return true;
    });

    const calculateTotal = (base: number, extra: number) => {
        return (base || 0) + (extra || 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Convert datetime-local string to Date/Timestamp
            const tripDate = new Date(currentTrip.tripDate as any);

            const tripData = {
                ...currentTrip,
                tripDate: Timestamp.fromDate(tripDate),
                baseRate: Number(currentTrip.baseRate),
                extraCharges: Number(currentTrip.extraCharges || 0),
                totalAmount: calculateTotal(Number(currentTrip.baseRate), Number(currentTrip.extraCharges)),
            } as any;

            if (isEditing && currentTrip.id) {
                await updateTrip(currentTrip.id, tripData);
            } else {
                await addTrip(tripData);
            }
            setIsModalOpen(false);
            fetchData(); // refresh
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (trip: Trip) => {
        setCurrentTrip({
            ...trip,
            tripDate: trip.tripDate?.toDate().toISOString().slice(0, 16) as any // format for input
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this trip?')) {
            await deleteTrip(id);
            fetchData();
        }
    };

    const openAddModal = () => {
        setCurrentTrip({
            status: 'scheduled',
            paymentStatus: 'unpaid',
            extraCharges: 0,
            baseRate: 0
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const getVehicleNumber = (id: string) => {
        const v = vehicles.find(v => v.id === id);
        return v ? v.numberPlate : 'Unknown';
    };

    const columns = [
        {
            header: 'Date & Time',
            accessor: (t: Trip) => {
                try {
                    const date = t.tripDate?.toDate ? t.tripDate.toDate() : new Date(t.tripDate as any);
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 500 }}>{format(date, 'MMM dd, yyyy')}</span>
                            <span className="text-muted text-sm">{format(date, 'hh:mm a')}</span>
                        </div>
                    );
                } catch (e) { return 'Invalid Date'; }
            }
        },
        { header: 'Vehicle', accessor: (t: Trip) => getVehicleNumber(t.vehicleId) },
        {
            header: 'Route', accessor: (t: Trip) => (
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
                    <span>{t.pickupLocation}</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>↓</span>
                    <span>{t.dropLocation}</span>
                </div>
            )
        },
        { header: 'Type', accessor: (t: Trip) => <span style={{ textTransform: 'capitalize' }}>{t.tripType}</span> },
        { header: 'Amount', accessor: (t: Trip) => `₹${t.totalAmount}` },
        {
            header: 'Status', accessor: (t: Trip) => (
                <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '99px',
                    backgroundColor: t.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' :
                        t.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                    color: t.status === 'completed' ? 'var(--color-success)' :
                        t.status === 'cancelled' ? 'var(--color-danger)' : 'var(--color-warning)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                }}>
                    {t.status}
                </span>
            )
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <h1 className="text-xl font-bold">Trips</h1>
                <Button onClick={openAddModal}>
                    <Plus size={18} /> Add Trip
                </Button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <Select
                    value={filterVehicle}
                    onChange={(e) => setFilterVehicle(e.target.value)}
                    options={vehicles.map(v => ({ label: v.numberPlate, value: v.id }))}
                    style={{ width: '200px' }}
                // I need to add a default empty option to Select or handle it
                />
                {/* My Select component doesn't support "All" easily unless I add it to options */}

                <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { label: 'All Statuses', value: '' },
                        { label: 'Scheduled', value: 'scheduled' },
                        { label: 'Running', value: 'running' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' },
                    ]}
                    style={{ width: '200px' }}
                />
            </div>

            <Table
                data={filteredTrips}
                columns={columns}
                actions={(t) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(t)}>
                            <Pencil size={14} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)} style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            <Trash2 size={14} />
                        </Button>
                    </div>
                )}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Edit Trip' : 'New Trip'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Select
                        label="Vehicle"
                        options={vehicles.filter(v => v.status === 'active').map(v => ({ label: v.numberPlate, value: v.id }))}
                        value={currentTrip.vehicleId || ''}
                        onChange={e => setCurrentTrip({ ...currentTrip, vehicleId: e.target.value })}
                        required
                    />

                    <Input
                        label="Trip Date"
                        type="datetime-local"
                        value={currentTrip.tripDate || ''}
                        onChange={e => setCurrentTrip({ ...currentTrip, tripDate: e.target.value })}
                        required
                    />

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Input
                            label="Pickup Location"
                            value={currentTrip.pickupLocation || ''}
                            onChange={e => setCurrentTrip({ ...currentTrip, pickupLocation: e.target.value })}
                            required
                        />
                        <Input
                            label="Drop Location"
                            value={currentTrip.dropLocation || ''}
                            onChange={e => setCurrentTrip({ ...currentTrip, dropLocation: e.target.value })}
                            required
                        />
                    </div>

                    <Select
                        label="Trip Type"
                        options={[
                            { label: 'Local', value: 'local' },
                            { label: 'Outstation', value: 'outstation' },
                            { label: 'Airport', value: 'airport' }
                        ]}
                        value={currentTrip.tripType || ''}
                        onChange={e => setCurrentTrip({ ...currentTrip, tripType: e.target.value as any })}
                        required
                    />

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Input
                            label="Base Rate"
                            type="number"
                            value={currentTrip.baseRate || ''}
                            onChange={e => setCurrentTrip({ ...currentTrip, baseRate: Number(e.target.value) })}
                            required
                        />
                        <Input
                            label="Extra Charges"
                            type="number"
                            value={currentTrip.extraCharges || 0}
                            onChange={e => setCurrentTrip({ ...currentTrip, extraCharges: Number(e.target.value) })}
                        />
                    </div>

                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius)', marginTop: '0.5rem' }}>
                        <span className="text-secondary text-sm">Total Amount: </span>
                        <span className="font-bold">₹{calculateTotal(Number(currentTrip.baseRate), Number(currentTrip.extraCharges))}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Select
                            label="Status"
                            options={[
                                { label: 'Scheduled', value: 'scheduled' },
                                { label: 'Running', value: 'running' },
                                { label: 'Completed', value: 'completed' },
                                { label: 'Cancelled', value: 'cancelled' }
                            ]}
                            value={currentTrip.status || 'scheduled'}
                            onChange={e => setCurrentTrip({ ...currentTrip, status: e.target.value as any })}
                            required
                        />
                        <Select
                            label="Payment"
                            options={[
                                { label: 'Unpaid', value: 'unpaid' },
                                { label: 'Partial', value: 'partial' },
                                { label: 'Paid', value: 'paid' },
                            ]}
                            value={currentTrip.paymentStatus || 'unpaid'}
                            onChange={e => setCurrentTrip({ ...currentTrip, paymentStatus: e.target.value as any })}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>{isEditing ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
