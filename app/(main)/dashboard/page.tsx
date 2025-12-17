'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { useVehicles } from '@/lib/hooks/useVehicles';
import { useTrips } from '@/lib/hooks/useTrips';
import { Trip, Vehicle } from '@/types';
import { format, isSameDay, isAfter, addDays, isBefore } from 'date-fns';
import Link from 'next/link';
import { Car, CheckCircle, Map, DollarSign } from 'lucide-react';

export default function DashboardPage() {
    const { vehicles, loading: vehiclesLoading } = useVehicles();
    const { trips, loading: tripsLoading } = useTrips();

    const stats = useMemo(() => {
        const activeVehicles = vehicles.filter(v => v.status === 'active').length;
        const today = new Date();

        // Safety check: tripDate can be null/undefined in partial updates
        const todayTrips = trips.filter(t => {
            if (!t.tripDate) return false;
            const d = t.tripDate instanceof Object && 'toDate' in t.tripDate ? (t.tripDate as any).toDate() : new Date(t.tripDate as any);
            return isSameDay(d, today);
        });

        const revenue = todayTrips
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        return {
            totalVehicles: vehicles.length,
            activeVehicles,
            todayTrips: todayTrips.length,
            todayRevenue: revenue,
            todayTripsList: todayTrips
        };
    }, [vehicles, trips]);

    const expiringVehicles = useMemo(() => {
        const today = new Date();
        const expiryThreshold = addDays(today, 30);
        const expiring: { v: Vehicle, type: string, date: Date }[] = [];

        vehicles.forEach(v => {
            const insurance = v.insuranceExpiry && 'toDate' in v.insuranceExpiry ? (v.insuranceExpiry as any).toDate() : null;
            const permit = v.permitExpiry && 'toDate' in v.permitExpiry ? (v.permitExpiry as any).toDate() : null;

            if (insurance && isAfter(insurance, today) && isBefore(insurance, expiryThreshold)) {
                expiring.push({ v, type: 'Insurance', date: insurance });
            }
            if (permit && isAfter(permit, today) && isBefore(permit, expiryThreshold)) {
                expiring.push({ v, type: 'Permit', date: permit });
            }
        });
        return expiring;
    }, [vehicles]);

    const loading = vehiclesLoading || tripsLoading;

    const statCards = [
        { label: 'Total Vehicles', value: stats.totalVehicles, color: 'var(--color-primary)', icon: Car },
        { label: 'Active Vehicles', value: stats.activeVehicles, color: 'var(--color-success)', icon: CheckCircle },
        { label: "Today's Trips", value: stats.todayTrips, color: 'var(--color-warning)', icon: Map },
        { label: "Today's Revenue", value: `₹${stats.todayRevenue}`, color: '#8b5cf6', icon: DollarSign },
    ];

    const tripColumns = [
        { header: 'Time', accessor: (t: Trip) => format(t.tripDate?.toDate(), 'hh:mm a') },
        { header: 'Type', accessor: (t: Trip) => <span style={{ textTransform: 'capitalize' }}>{t.tripType}</span> },
        { header: 'Route', accessor: (t: Trip) => `${t.pickupLocation} -> ${t.dropLocation}` },
        { header: 'Amount', accessor: (t: Trip) => `₹${t.totalAmount}` },
        { header: 'Status', accessor: 'status' as keyof Trip },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="text-xl font-bold">Dashboard Overview</h1>
            </div>

            <div className="stats-grid">
                {statCards.map((stat, i) => (
                    <Card key={i} className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="text-muted text-sm" style={{ fontWeight: 500 }}>{stat.label}</span>
                            <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: `${stat.color}20` }}>
                                <stat.icon size={20} strokeWidth={2} className="icon" />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                            {stat.value}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="dashboard-grid">
                <Card title="Today's Trips" className="trips-card">
                    <Table
                        data={stats.todayTripsList}
                        columns={tripColumns}
                    />
                    {stats.todayTripsList.length === 0 && !loading && (
                        <div className="empty-state">No trips scheduled for today.</div>
                    )}
                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                        <Link href="/trips" style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                            View All Trips →
                        </Link>
                    </div>
                </Card>

                <Card title="Upcoming Expiries">
                    {expiringVehicles.length === 0 && (
                        <div className="empty-state">
                            <p>✓ No upcoming expiries</p>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {expiringVehicles.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius)',
                                backgroundColor: 'hsl(0, 70%, 98%)',
                                borderLeft: '3px solid var(--color-danger)'
                            }}>
                                <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>⚠</span>
                                <div>
                                    <div style={{ fontWeight: 500 }}>{item.v.numberPlate}</div>
                                    <div className="text-muted text-sm">{item.type} Expires: {format(item.date, 'dd MMM')}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
