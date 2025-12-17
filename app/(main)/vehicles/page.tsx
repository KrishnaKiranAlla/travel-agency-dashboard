'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Vehicle } from '@/types';
import { addVehicle, updateVehicle, deleteVehicle } from '@/lib/services/vehicleService';
import { useVehicles } from '@/lib/hooks/useVehicles';
import { Timestamp } from 'firebase/firestore';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function VehiclesPage() {
    const { vehicles, loading } = useVehicles();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentVehicle, setCurrentVehicle] = useState<Partial<Vehicle>>({});
    const [isEditing, setIsEditing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const vehicleData = {
                ...currentVehicle,
                seats: Number(currentVehicle.seats),
            } as any;

            console.log("Submitting vehicle:", vehicleData); // Debug log

            if (isEditing && currentVehicle.id) {
                await updateVehicle(currentVehicle.id, vehicleData);
            } else {
                await addVehicle(vehicleData);
            }
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Error saving vehicle:", error);
            alert(`Failed to save vehicle: ${error.message || error}`);
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        setCurrentVehicle(vehicle);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this vehicle?')) {
            await deleteVehicle(id);
        }
    };

    const openAddModal = () => {
        setCurrentVehicle({ status: 'active', ac: true, ownerType: 'self' });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: 'Vehicle', accessor: (v: Vehicle) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{v.name || 'Unnamed'}</div>
                    <div className="text-muted text-sm">{v.numberPlate}</div>
                </div>
            )
        },
        { header: 'Type', accessor: 'type' as keyof Vehicle },
        { header: 'Seats', accessor: 'seats' as keyof Vehicle },
        {
            header: 'Status', accessor: (v: Vehicle) => (
                <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '99px',
                    backgroundColor: v.status === 'active' ? 'hsl(150, 70%, 95%)' : 'hsl(0, 70%, 95%)',
                    color: v.status === 'active' ? 'var(--color-success)' : 'var(--color-danger)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                }}>
                    {v.status}
                </span>
            )
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="text-xl font-bold">Vehicles</h1>
                <Button onClick={openAddModal}>
                    <Plus size={16} strokeWidth={2} className="icon" /> Add Vehicle
                </Button>
            </div>

            <Table
                data={vehicles}
                columns={columns}
                actions={(v) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(v)} title="Edit">
                            <Pencil size={14} strokeWidth={2} className="icon" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(v.id)} style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} title="Delete">
                            <Trash2 size={14} strokeWidth={2} className="icon" />
                        </Button>
                    </div>
                )}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={isEditing ? 'Edit Vehicle' : 'Add Vehicle'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                        label="Vehicle Name"
                        value={currentVehicle.name || ''}
                        onChange={e => setCurrentVehicle({ ...currentVehicle, name: e.target.value })}
                        required
                        placeholder="e.g. White Innova Crysta"
                    />
                    <Input
                        label="Number Plate"
                        value={currentVehicle.numberPlate || ''}
                        onChange={e => setCurrentVehicle({ ...currentVehicle, numberPlate: e.target.value })}
                        required
                        placeholder="TN 01 AB 1234"
                    />
                    <div className="form-grid">
                        <Select
                            label="Type"
                            options={[
                                { label: 'Sedan', value: 'Sedan' },
                                { label: 'SUV', value: 'SUV' },
                                { label: 'Tempo', value: 'Tempo Traveller' },
                                { label: 'Mini Bus', value: 'Mini Bus' },
                            ]}
                            value={currentVehicle.type || 'Sedan'}
                            onChange={e => setCurrentVehicle({ ...currentVehicle, type: e.target.value })}
                            required
                        />
                        <Input
                            label="Seats"
                            type="number"
                            value={currentVehicle.seats || ''}
                            onChange={e => setCurrentVehicle({ ...currentVehicle, seats: Number(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="form-grid">
                        <Input
                            label="Insurance Expiry"
                            type="date"
                            value={currentVehicle.insuranceExpiry && (currentVehicle.insuranceExpiry as any).toDate ? (currentVehicle.insuranceExpiry as any).toDate().toISOString().split('T')[0] : ''}
                            onChange={e => setCurrentVehicle({ ...currentVehicle, insuranceExpiry: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined })}
                        />
                        <Input
                            label="Permit Expiry"
                            type="date"
                            value={currentVehicle.permitExpiry && (currentVehicle.permitExpiry as any).toDate ? (currentVehicle.permitExpiry as any).toDate().toISOString().split('T')[0] : ''}
                            onChange={e => setCurrentVehicle({ ...currentVehicle, permitExpiry: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined })}
                        />
                    </div>

                    <Select
                        label="Status"
                        options={[
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                        ]}
                        value={currentVehicle.status || 'active'}
                        onChange={e => setCurrentVehicle({ ...currentVehicle, status: e.target.value as any })}
                        required
                    />

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} fullWidth>Cancel</Button>
                        <Button type="submit" fullWidth>{isEditing ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
