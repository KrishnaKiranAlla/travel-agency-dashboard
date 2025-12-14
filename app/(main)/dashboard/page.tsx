'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { useVehicles } from '@/lib/hooks/useVehicles';
import { useTrips } from '@/lib/hooks/useTrips';
import { Trip, Vehicle } from '@/types';
import { format, isSameDay, isAfter, addDays, isBefore } from 'date-fns';
import { Car, CheckCircle, Map, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

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
        { label: 'Total Vehicles', value: stats.totalVehicles, icon: Car, color: 'var(--color-primary)' },
        { label: 'Active Vehicles', value: stats.activeVehicles, icon: CheckCircle, color: 'var(--color-success)' },
        { label: "Today's Trips", value: stats.todayTrips, icon: Map, color: 'var(--color-warning)' },
        { label: "Today's Revenue", value: `₹${stats.todayRevenue}`, icon: DollarSign, color: '#8b5cf6' },
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
            <h1 className="text-xl font-bold" style={{ marginBottom: '1.5rem' }}>Dashboard Overview</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {statCards.map((stat, i) => (
                    <Card key={i} className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="text-muted text-sm" style={{ fontWeight: 500 }}>{stat.label}</span>
                            <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: `${stat.color}20` }}>
                                <stat.icon size={20} color={stat.color} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                            {stat.value}
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <Card title="Today's Trips" className="trips-card">
                    <Table
                        data={stats.todayTripsList}
                        columns={tripColumns}
                    />
                    {stats.todayTripsList.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>No trips scheduled for today.</div>
                    )}
                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                        <Link href="/trips" style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                            View All Trips →
                        </Link>
                    </div>
                </Card>

                <Card title="Upcoming Expiries">
                    {expiringVehicles.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <CheckCircle size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                            <p>No upcoming expiries</p>
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
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                borderLeft: '3px solid var(--color-danger)'
                            }}>
                                <AlertTriangle size={20} color="var(--color-danger)" />
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
