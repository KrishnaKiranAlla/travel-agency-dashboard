'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useTrips } from '@/lib/hooks/useTrips';
import { Trip } from '@/types';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { DollarSign, TrendingUp } from 'lucide-react';

type FilterType = 'date' | 'week' | 'month';

export default function RevenuePage() {
    const { trips, loading } = useTrips();
    const [filterType, setFilterType] = useState<FilterType>('date');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const getDateRange = (type: FilterType, dateStr: string) => {
        const date = new Date(dateStr);

        switch (type) {
            case 'date':
                return {
                    start: startOfDay(date),
                    end: endOfDay(date),
                    label: format(date, 'MMMM d, yyyy')
                };
            case 'week':
                const weekStart = startOfWeek(date, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
                return {
                    start: weekStart,
                    end: weekEnd,
                    label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                };
            case 'month':
                const monthStart = startOfMonth(date);
                const monthEnd = endOfMonth(date);
                return {
                    start: monthStart,
                    end: monthEnd,
                    label: format(date, 'MMMM yyyy')
                };
            default:
                return { start: date, end: date, label: '' };
        }
    };

    const { filteredTrips, stats } = useMemo(() => {
        const range = getDateRange(filterType, selectedDate);

        const filtered = trips.filter(trip => {
            if (!trip.tripDate) return false;
            const tripDate = trip.tripDate instanceof Object && 'toDate' in trip.tripDate 
                ? (trip.tripDate as any).toDate() 
                : new Date(trip.tripDate as any);
            return isWithinInterval(tripDate, {
                start: range.start,
                end: range.end
            });
        });

        const completedTrips = filtered.filter(t => t.status === 'completed');
        const totalRevenue = completedTrips.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const totalAdvance = completedTrips.reduce((sum, t) => sum + (t.advanceAmount || 0), 0);
        const remainingRevenue = totalRevenue - totalAdvance;

        return {
            filteredTrips: filtered.sort((a, b) => {
                const dateA = a.tripDate instanceof Object && 'toDate' in a.tripDate ? (a.tripDate as any).toDate() : new Date(a.tripDate as any);
                const dateB = b.tripDate instanceof Object && 'toDate' in b.tripDate ? (b.tripDate as any).toDate() : new Date(b.tripDate as any);
                return dateB.getTime() - dateA.getTime();
            }),
            stats: {
                totalTrips: filtered.length,
                completedTrips: completedTrips.length,
                totalRevenue,
                totalAdvance,
                remainingRevenue,
                dateRange: getDateRange(filterType, selectedDate).label
            }
        };
    }, [trips, filterType, selectedDate]);

    const statCards = [
        {
            label: 'Total Trips',
            value: stats.totalTrips,
            color: 'hsl(220, 90%, 56%)',
            icon: TrendingUp
        },
        {
            label: 'Completed Trips',
            value: stats.completedTrips,
            color: 'hsl(150, 70%, 40%)',
            icon: TrendingUp
        },
        {
            label: 'Total Revenue',
            value: `₹${stats.totalRevenue}`,
            color: 'hsl(220, 90%, 56%)',
            icon: DollarSign
        },
        {
            label: 'Advance Received',
            value: `₹${stats.totalAdvance}`,
            color: 'hsl(45, 90%, 50%)',
            icon: DollarSign
        },
        {
            label: 'Remaining to Collect',
            value: `₹${stats.remainingRevenue}`,
            color: stats.remainingRevenue > 0 ? 'hsl(0, 70%, 55%)' : 'hsl(150, 70%, 40%)',
            icon: DollarSign
        }
    ];

    const columns = [
        {
            header: 'Time',
            accessor: (t: Trip) => {
                try {
                    const date = t.tripDate?.toDate ? t.tripDate.toDate() : new Date(t.tripDate as any);
                    return format(date, 'MMM d, hh:mm a');
                } catch (e) { return '--'; }
            }
        },
        { header: 'Type', accessor: (t: Trip) => <span style={{ textTransform: 'capitalize' }}>{t.tripType}</span> },
        { header: 'Route', accessor: (t: Trip) => `${t.pickupLocation} → ${t.dropLocation}` },
        {
            header: 'Amount',
            accessor: (t: Trip) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontWeight: 600 }}>₹{t.totalAmount}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Advance: ₹{t.advanceAmount || 0}
                    </span>
                </div>
            )
        },
        {
            header: 'Balance',
            accessor: (t: Trip) => (
                <span style={{ color: t.totalAmount - (t.advanceAmount || 0) <= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                    ₹{Math.max(0, t.totalAmount - (t.advanceAmount || 0))}
                </span>
            )
        },
        {
            header: 'Status',
            accessor: (t: Trip) => {
                const statusStyles: Record<string, any> = {
                    completed: { bg: 'hsl(150, 70%, 95%)', color: 'hsl(150, 70%, 35%)' },
                    running: { bg: 'hsl(45, 90%, 95%)', color: 'hsl(45, 90%, 40%)' },
                    scheduled: { bg: 'hsl(215, 90%, 95%)', color: 'hsl(215, 90%, 45%)' },
                    cancelled: { bg: 'hsl(0, 70%, 95%)', color: 'hsl(0, 70%, 45%)' },
                };
                const s = statusStyles[t.status] || statusStyles.scheduled;
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
                        {t.status}
                    </span>
                );
            }
        }
    ];

    if (loading) {
        return <div className="loading-container">Loading revenue data...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="text-xl font-bold">Revenue Report</h1>
            </div>

            <div className="filters-container">
                <Select
                    label="Filter By"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                    options={[
                        { label: 'Daily', value: 'date' },
                        // { label: 'Weekly', value: 'week' },
                        { label: 'Monthly', value: 'month' }
                    ]}
                />

                <Input
                    label={
                        filterType === 'date' ? 'Select Date' :
                        filterType === 'week' ? 'Select Week' : 'Select Month'
                    }
                    type={filterType === 'date' ? 'date' : filterType === 'week' ? 'week' : 'month'}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
            </div>

            <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Showing data for: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.dateRange}</span>
            </div>

            <div className="stats-grid">
                {statCards.map((stat, i) => (
                    <Card key={i} className="stat-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span className="text-muted text-sm" style={{ fontWeight: 500 }}>{stat.label}</span>
                            <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: `${stat.color}20` }}>
                                <stat.icon size={20} color={stat.color} />
                            </div>
                        </div>
                        <div className="font-bold" style={{ fontSize: '1.25rem', color: stat.color }}>
                            {stat.value}
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h2 className="text-lg font-bold" style={{ marginBottom: '1rem' }}>Trip Details</h2>
                <Table
                    data={filteredTrips}
                    columns={columns}
                />
            </div>
        </div>
    );
}
