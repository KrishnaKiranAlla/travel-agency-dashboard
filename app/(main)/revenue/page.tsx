'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { DateRangeFilter } from '@/components/ui/DateRangeFilter';
import { useTrips } from '@/lib/hooks/useTrips';
import { Trip } from '@/types';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import styles from './page.module.css';
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
            bgClass: styles.blue,
            icon: TrendingUp
        },
        {
            label: 'Completed Trips',
            value: stats.completedTrips,
            color: 'hsl(150, 70%, 40%)',
            bgClass: styles.green,
            icon: BarChart3
        },
        {
            label: 'Total Revenue',
            value: `₹${stats.totalRevenue}`,
            color: 'hsl(220, 90%, 56%)',
            bgClass: styles.blue,
            icon: DollarSign
        },
        {
            label: 'Advance Received',
            value: `₹${stats.totalAdvance}`,
            color: 'hsl(45, 90%, 50%)',
            bgClass: styles.yellow,
            icon: Wallet
        },
        {
            label: 'Remaining to Collect',
            value: `₹${stats.remainingRevenue}`,
            color: stats.remainingRevenue > 0 ? 'hsl(0, 70%, 55%)' : 'hsl(150, 70%, 40%)',
            bgClass: stats.remainingRevenue > 0 ? styles.red : styles.green,
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
        { header: 'Type', accessor: (t: Trip) => <span className={styles.tripTypeSpan}>{t.tripType}</span> },
        { header: 'Route', accessor: (t: Trip) => `${t.pickupLocation} → ${t.dropLocation}` },
        {
            header: 'Amount',
            accessor: (t: Trip) => (
                <div className={styles.tableAmountColumn}>
                    <span className={styles.amountValue}>₹{t.totalAmount}</span>
                    <span className={styles.advanceValue}>
                        Advance: ₹{t.advanceAmount || 0}
                    </span>
                </div>
            )
        },
        {
            header: 'Balance',
            accessor: (t: Trip) => {
                const balance = t.totalAmount - (t.advanceAmount || 0);
                return (
                    <span className={`${styles.balanceColumn} ${balance <= 0 ? styles.balanceZero : styles.balancePositive}`}>
                        ₹{Math.max(0, balance)}
                    </span>
                );
            }
        },
        {
            header: 'Status',
            accessor: (t: Trip) => {
                const statusClassMap: Record<string, string> = {
                    completed: styles.statusCompleted,
                    running: styles.statusRunning,
                    scheduled: styles.statusScheduled,
                    cancelled: styles.statusCancelled,
                };
                const statusClass = statusClassMap[t.status] || styles.statusScheduled;
                return (
                    <span className={`${styles.statusBadge} ${statusClass}`}>
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
            <div className={styles.pageHeader}>
                <h1>Revenue Report</h1>
            </div>

            <div className={styles.dateRangeWrapper}>
                <DateRangeFilter
                    filterType={filterType}
                    selectedDate={selectedDate}
                    onFilterTypeChange={(newType) => {
                        setFilterType(newType);
                        setSelectedDate(getDefaultDate(newType));
                    }}
                    onDateChange={setSelectedDate}
                />
            </div>

            <div className={styles.dateLabel}>
                Showing data for: <span className={styles.dateLabelValue}>{stats.dateRange}</span>
            </div>

            <div className={styles.statsGrid}>
                {statCards.map((stat, i) => (
                    <Card key={i} className={styles.statCard}>
                        <div className={styles.statHeader}>
                                        <span className={styles.statLabel}>{stat.label}</span>
                                        <div className={`${styles.iconContainer} ${stat.bgClass}`}>
                                            <div className={styles.iconWrapper}>
                                                <stat.icon size={20} strokeWidth={2} className="icon" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.statValue} style={{ color: stat.color }}>
                                        {stat.value}
                                    </div>
                    </Card>
                ))}
            </div>

            <div className={styles.tripDetailsSection}>
                <h2 className={styles.tripDetailsTitle}>Trip Details</h2>
                <Table
                    data={filteredTrips}
                    columns={columns}
                />
            </div>
        </div>
    );
}
