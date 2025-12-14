'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { getTrips } from '@/lib/services/tripService';
import { Trip } from '@/types';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

export default function ReportsPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [trips, setTrips] = useState<Trip[]>([]);
    const [reportData, setReportData] = useState<{
        totalTrips: number;
        totalRevenue: number;
        vehicleUtilization: Record<string, number>;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({});

    const generateReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) return;

        setLoading(true);
        setGenerated(false);

        try {
            const [allTrips, allVehicles] = await Promise.all([getTrips(), import('@/lib/services/vehicleService').then(m => m.getVehicles())]);

            const vMap: Record<string, string> = {};
            allVehicles.forEach(v => vMap[v.id] = v.numberPlate);
            setVehicleMap(vMap);

            const start = startOfDay(new Date(startDate));
            const end = endOfDay(new Date(endDate));

            const filtered = allTrips.filter(t => {
                const d = t.tripDate?.toDate ? t.tripDate.toDate() : new Date(t.tripDate as any);
                return isWithinInterval(d, { start, end });
            });

            setTrips(filtered);

            // Calculate Stats
            const totalRevenue = filtered
                .filter(t => t.status === 'completed')
                .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

            const utilization: Record<string, number> = {}; // vehicleId -> count
            filtered.forEach(t => {
                utilization[t.vehicleId] = (utilization[t.vehicleId] || 0) + 1;
            });

            setReportData({
                totalTrips: filtered.length,
                totalRevenue,
                vehicleUtilization: utilization
            });

            setGenerated(true);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { header: 'Date', accessor: (t: Trip) => format(t.tripDate?.toDate(), 'dd MMM yyyy') },
        { header: 'Route', accessor: (t: Trip) => `${t.pickupLocation} -> ${t.dropLocation}` },
        { header: 'Amount', accessor: (t: Trip) => `₹${t.totalAmount}` },
        { header: 'Status', accessor: 'status' as keyof Trip },
    ];

    return (
        <div>
            <div className="page-header">
                <h1 className="text-xl font-bold">Reports</h1>
            </div>

            <Card style={{ marginBottom: '2rem' }}>
                <form onSubmit={generateReport} className="flex flex-wrap gap-4 items-end">
                    <div style={{ minWidth: '200px', flex: 1 }}>
                        <Input
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ minWidth: '200px', flex: 1 }}>
                        <Input
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" isLoading={loading}>
                        <BarChart3 size={18} /> Generate
                    </Button>
                </form>
            </Card>

            {generated && reportData && (
                <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                    <div className="stats-grid">
                        <Card>
                            <div className="text-muted text-sm font-bold">Total Trips</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{reportData.totalTrips}</div>
                        </Card>
                        <Card>
                            <div className="text-muted text-sm font-bold">Total Revenue</div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>₹{reportData.totalRevenue}</div>
                        </Card>
                    </div>

                    <div className="dashboard-grid">
                        <Card title="Trip Details">
                            <Table data={trips} columns={columns} />
                        </Card>

                        <Card title="Vehicle Utilization">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '0.5rem', fontSize: '0.9rem' }}>Vehicle</th>
                                        <th style={{ padding: '0.5rem', fontSize: '0.9rem' }}>Trips</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(reportData.vehicleUtilization).map(([vid, count]) => (
                                        <tr key={vid} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                {vehicleMap[vid] || vid.slice(0, 8) + '...'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{count as number}</td>
                                        </tr>
                                    ))}
                                    {Object.keys(reportData.vehicleUtilization).length === 0 && (
                                        <tr><td colSpan={2} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No utilization data</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
