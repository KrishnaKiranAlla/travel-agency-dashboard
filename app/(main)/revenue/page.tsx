'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { useTrips } from '@/lib/hooks/useTrips';
import { Trip } from '@/types';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { TrendingUp, BarChart3, DollarSign, Wallet } from 'lucide-react';

type FilterType = 'date' | 'week' | 'month';

export default function RevenuePage() {
    const { trips, loading } = useTrips();
    const [filterType, setFilterType] = useState<FilterType>('date');
    
    // Helper to get default date in correct format
    const getDefaultDate = (type: FilterType) => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
        
        if (type === 'month') {
            return `${year}-${month}`;
        } else if (type === 'week') {
            // Calculate ISO week number
            const firstDay = new Date(year, 0, 1);
            const days = Math.floor((today.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
            const week = String(Math.ceil((days + firstDay.getDay() + 1) / 7)).padStart(2, '0');
            return `${year}-W${week}`;
        }
        return `${year}-${month}-${date}`;
    };

    const [selectedDate, setSelectedDate] = useState(getDefaultDate('date'));

    const getDateRange = (type: FilterType, dateStr: string) => {
        let date: Date;

        if (type === 'week') {
            // Parse ISO week format (YYYY-Www) to Date
            // Example: "2025-W51" means year 2025, week 51
            const [year, week] = dateStr.split('-W').map(Number);
            const simple = new Date(year, 0, 1 + (week - 1) * 7);
            const dayOfWeek = simple.getDay();
            const ISOweekStart = simple;
            if (dayOfWeek <= 4)
                ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
            else
                ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
            date = ISOweekStart;
        } else if (type === 'month') {
            // For month input (YYYY-MM), use first day of month
            date = new Date(dateStr + '-01');
        } else {
            // For date input (YYYY-MM-DD)
            date = new Date(dateStr);
        }

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

        // Debug logging
        if (process.env.NODE_ENV === 'development') {
            console.log('📊 Revenue Calculation Debug:', {
                filterType,
                selectedDate,
                dateRange: range.label,
                totalTripsLoaded: trips.length,
                tripsInDateRange: filtered.length,
                completedTrips: completedTrips.length,
                totalRevenue,
                totalAdvance,
                remainingRevenue,
                completedTripsData: completedTrips.map(t => ({
                    id: t.id,
                    amount: t.totalAmount,
                    advance: t.advanceAmount,
                    balance: t.totalAmount - (t.advanceAmount || 0),
                    status: t.status
                }))
            });
        }

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
            icon: BarChart3
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
            icon: Wallet
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

            <DateRangeFilter
                filterType={filterType}
                selectedDate={selectedDate}
                onFilterTypeChange={(newType) => {
                    setFilterType(newType);
                    setSelectedDate(getDefaultDate(newType));
                }}
                onDateChange={setSelectedDate}
            />

            <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Showing data for: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.dateRange}</span>
            </div>

            <div className="stats-grid">
                {statCards.map((stat, i) => {
                    const IconComponent = stat.icon;
                    return (
                        <Card key={i} className="stat-card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.75rem' }}>
                                <span className="text-muted text-sm" style={{ fontWeight: 500, flex: 1, minWidth: 0 }}>{stat.label}</span>
                                <div style={{ 
                                    padding: '0.6rem', 
                                    borderRadius: '50%', 
                                    backgroundColor: `${stat.color}20`, 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    flexShrink: 0,
                                    width: '40px',
                                    height: '40px',
                                    minWidth: '40px',
                                    minHeight: '40px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        height: '100%'
                                    }}>
                                        <IconComponent 
                                            size={22} 
                                            color={stat.color} 
                                            strokeWidth={2}
                                            style={{ 
                                                display: 'block',
                                                width: '22px',
                                                height: '22px'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="font-bold" style={{ fontSize: '1.25rem', color: stat.color }}>
                                {stat.value}
                            </div>
                        </Card>
                    );
                })}
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
