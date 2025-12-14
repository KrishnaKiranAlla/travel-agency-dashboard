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

            if (isEditing && currentVehicle.id) {
                await updateVehicle(currentVehicle.id, vehicleData);
            } else {
                await addVehicle(vehicleData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
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
        { header: 'Number Plate', accessor: 'numberPlate' as keyof Vehicle },
        { header: 'Type', accessor: 'type' as keyof Vehicle },
        { header: 'Seats', accessor: 'seats' as keyof Vehicle },
        {
            header: 'Status', accessor: (v: Vehicle) => (
                <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '99px',
                    backgroundColor: v.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
                <h1 className="text-xl font-bold">Vehicles</h1>
                <Button onClick={openAddModal}>
                    <Plus size={18} /> Add Vehicle
                </Button>
            </div>

            <Table
                data={vehicles}
                columns={columns}
                actions={(v) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(v)} title="Edit">
                            <Pencil size={14} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(v.id)} style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} title="Delete">
                            <Trash2 size={14} />
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
                        label="Number Plate"
                        value={currentVehicle.numberPlate || ''}
                        onChange={e => setCurrentVehicle({ ...currentVehicle, numberPlate: e.target.value })}
                        required
                        placeholder="TN 01 AB 1234"
                    />
                    <Select
                        label="Type"
                        options={[
                            { label: 'Sedan', value: 'Sedan' },
                            { label: 'SUV', value: 'SUV' },
                            { label: 'Tempo Traveller', value: 'Tempo Traveller' },
                            { label: 'Bus', value: 'Bus' },
                            { label: 'Mini Bus', value: 'Mini Bus' }
                        ]}
                        value={currentVehicle.type || ''}
                        onChange={e => setCurrentVehicle({ ...currentVehicle, type: e.target.value })}
                        required
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Input
                            label="Seats"
                            type="number"
                            value={currentVehicle.seats || ''}
                            onChange={e => setCurrentVehicle({ ...currentVehicle, seats: Number(e.target.value) })}
                            required
                        />
                        <Select
                            label="Status"
                            options={[
                                { label: 'Active', value: 'active' },
                                { label: 'Inactive', value: 'inactive' }
                            ]}
                            value={currentVehicle.status || 'active'}
                            onChange={e => setCurrentVehicle({ ...currentVehicle, status: e.target.value as any })}
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
