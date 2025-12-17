'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Trip, Vehicle } from '@/types';
import { addTrip, updateTrip, deleteTrip } from '@/lib/services/tripService';
import { useVehicles } from '@/lib/hooks/useVehicles';
import { useTrips } from '@/lib/hooks/useTrips';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export default function TripsPage() {
    const { trips, loading: tripsLoading } = useTrips();
    const { vehicles, loading: vehiclesLoading } = useVehicles();
    const loading = tripsLoading || vehiclesLoading;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTrip, setCurrentTrip] = useState<any>({});
    const [isEditing, setIsEditing] = useState(false);

    // Filters
    const todayStr = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState(todayStr); // Default to today
    const [filterStatus, setFilterStatus] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');

    // Filtered trips logic - simplified for MVP (client-side filtering of loaded trips)
    // NOTE: In a real 'large scale' app, we would query Firestore by date. 
    // Since we fetch "active" trips or "recent" trips via hook, we filter client side here.
    const filteredTrips = trips.filter(trip => {
        // Date Filter
        if (filterDate) {
            const tDate = trip.tripDate?.toDate ? trip.tripDate.toDate() : new Date(trip.tripDate as any);
            const tDateStr = format(tDate, 'yyyy-MM-dd');
            if (tDateStr !== filterDate) return false;
        }

        if (filterStatus && trip.status !== filterStatus) return false;
        if (filterVehicle && trip.vehicleId !== filterVehicle) return false;
        return true;
    });

    const calculateTotal = (base: number, extra: number) => {
        return (base || 0) + (extra || 0);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, any> = {
            scheduled: { bg: 'hsl(215, 90%, 95%)', color: 'hsl(215, 90%, 45%)' },
            running: { bg: 'hsl(45, 90%, 95%)', color: 'hsl(45, 90%, 40%)' },
            completed: { bg: 'hsl(150, 70%, 95%)', color: 'hsl(150, 70%, 35%)' },
            cancelled: { bg: 'hsl(0, 70%, 95%)', color: 'hsl(0, 70%, 45%)' },
        };
        const s = styles[status] || styles.scheduled;
        return (
            <span style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: s.bg,
                color: s.color,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                border: `1px solid ${s.color}20`
            }}>
                {status}
            </span>
        );
    };

    const getPaymentBadge = (status: string) => {
        const styles: Record<string, any> = {
            paid: { bg: 'hsl(150, 70%, 95%)', color: 'hsl(150, 70%, 35%)' },
            partial: { bg: 'hsl(45, 90%, 95%)', color: 'hsl(45, 90%, 40%)' },
            unpaid: { bg: 'hsl(0, 0%, 95%)', color: 'hsl(0, 0%, 45%)' },
        };
        const s = styles[status] || styles.unpaid;
        return (
            <span style={{
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: s.bg,
                color: s.color,
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'capitalize'
            }}>
                {status}
            </span>
        );
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
                advanceAmount: Number(currentTrip.advanceAmount || 0),
                totalAmount: calculateTotal(Number(currentTrip.baseRate), Number(currentTrip.extraCharges)),
            } as any;

            if (isEditing && currentTrip.id) {
                await updateTrip(currentTrip.id, tripData);
            } else {
                await addTrip(tripData);
            }
            setIsModalOpen(false);
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
        return v ? (v.name ? `${v.name} (${v.numberPlate})` : v.numberPlate) : 'Unknown';
    };

    const columns = [
        {
            header: 'Time',
            accessor: (t: Trip) => {
                try {
                    const date = t.tripDate?.toDate ? t.tripDate.toDate() : new Date(t.tripDate as any);
                    return format(date, 'hh:mm a');
                } catch (e) { return '--:--'; }
            }
        },
        { header: 'Vehicle', accessor: (t: Trip) => getVehicleNumber(t.vehicleId) },
        {
            header: 'Route', accessor: (t: Trip) => (
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', lineHeight: 1.3 }}>
                    <span style={{ fontWeight: 500 }}>{t.pickupLocation}</span>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>to {t.dropLocation}</span>
                </div>
            )
        },
        {
            header: 'Amount / Pay',
            accessor: (t: Trip) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontWeight: 600 }}>₹{t.totalAmount}</span>
                    <div>{getPaymentBadge(t.paymentStatus)}</div>
                </div>
            )
        },
        {
            header: 'Status', accessor: (t: Trip) => getStatusBadge(t.status)
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="text-xl font-bold">Trips</h1>
                <Button onClick={openAddModal}>
                    <Plus size={18} /> Add Trip
                </Button>
            </div>

            <div className="filters-container">
                <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    label="Date"
                />

                <Select
                    label="Vehicle"
                    value={filterVehicle}
                    onChange={(e) => setFilterVehicle(e.target.value)}
                    options={[
                        { label: 'All Vehicles', value: '' },
                        ...vehicles.map(v => ({
                            label: v.name ? `${v.name} (${v.numberPlate})` : v.numberPlate,
                            value: v.id
                        }))
                    ]}
                />

                <Select
                    label="Status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    options={[
                        { label: 'All Statuses', value: '' },
                        { label: 'Scheduled', value: 'scheduled' },
                        { label: 'Running', value: 'running' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' },
                    ]}
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
                        options={vehicles.filter(v => v.status === 'active').map(v => ({
                            label: v.name ? `${v.name} (${v.numberPlate})` : v.numberPlate,
                            value: v.id
                        }))}
                        value={currentTrip.vehicleId || ''}
                        onChange={e => setCurrentTrip({ ...currentTrip, vehicleId: e.target.value })}
                        required
                    />

                    <Input
                        label="Trip Date & Time"
                        type="datetime-local"
                        value={currentTrip.tripDate || ''}
                        onChange={e => setCurrentTrip({ ...currentTrip, tripDate: e.target.value })}
                        required
                    />

                    <div className="form-grid">
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

                    <div className="form-grid">
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
                        <Input
                            label="Base Rate (₹)"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="0"
                            step="1"
                            value={currentTrip.baseRate || ''}
                            onChange={e => setCurrentTrip({ ...currentTrip, baseRate: Math.max(0, Number(e.target.value)) })}
                            required
                        />
                    </div>

                    <div className="form-grid">
                        <Input
                            label="Extra Charges (₹)"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="0"
                            step="1"
                            value={currentTrip.extraCharges || 0}
                            onChange={e => setCurrentTrip({ ...currentTrip, extraCharges: Math.max(0, Number(e.target.value)) })}
                        />
                        <Input
                            label="Advance Amount (₹)"
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="0"
                            step="1"
                            value={currentTrip.advanceAmount || 0}
                            onChange={e => setCurrentTrip({ ...currentTrip, advanceAmount: Math.max(0, Number(e.target.value)) })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span className="text-secondary text-sm">Total Amount</span>
                            <span className="font-bold" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>₹{calculateTotal(Number(currentTrip.baseRate), Number(currentTrip.extraCharges))}</span>
                        </div>
                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span className="text-secondary text-sm">Remaining Balance</span>
                            <span className="font-bold" style={{ fontSize: '1.1rem', color: calculateTotal(Number(currentTrip.baseRate), Number(currentTrip.extraCharges)) - (currentTrip.advanceAmount || 0) <= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>₹{Math.max(0, calculateTotal(Number(currentTrip.baseRate), Number(currentTrip.extraCharges)) - (currentTrip.advanceAmount || 0))}</span>
                        </div>
                    </div>

                    <div className="form-grid">
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

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>{isEditing ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
