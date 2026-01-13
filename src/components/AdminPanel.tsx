"use client";



import { useState, useTransition, useEffect } from 'react';
import { format, addMonths, startOfMonth, addYears, getYear } from 'date-fns';
import { toggleMonthLock, getLocksForYear } from '@/app/actions';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Assuming lucide-react is available as per AvailabilityCalendar usage

interface MonthLockStatus {
    monthStart: string; // YYYY-MM-01
    isLocked: boolean;
}

interface AdminPanelProps {
    initialLocks: MonthLockStatus[]; // Not strictly needed for year view logic, but good for caching
}

export function AdminPanel({ initialLocks }: AdminPanelProps) {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [locks, setLocks] = useState<MonthLockStatus[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pending, startTransition] = useTransition();

    const fetchLocks = async (year: number) => {
        setIsLoading(true);
        try {
            const data = await getLocksForYear(year);
            // We need to ensure we have entries for all 12 months, defaulting to Open (false) if missing
            const yearStart = new Date(year, 0, 1);
            const fullYearLocks = Array.from({ length: 12 }).map((_, i) => {
                const monthDate = addMonths(yearStart, i);
                const monthStr = format(monthDate, 'yyyy-MM-01');
                const existing = data.find(d => d.monthStart === monthStr);
                return {
                    monthStart: monthStr,
                    isLocked: existing ? existing.isLocked : false
                };
            });
            setLocks(fullYearLocks);
        } catch (error) {
            console.error("Failed to fetch locks", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchLocks(currentYear);
    }, [currentYear]);


    const handleToggle = (monthStart: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        // Optimistic Update
        setLocks(prev => prev.map(l =>
            l.monthStart === monthStart ? { ...l, isLocked: newStatus } : l
        ));

        startTransition(async () => {
            try {
                await toggleMonthLock(monthStart, newStatus);
            } catch (err) {
                console.error("Failed to toggle lock:", err);
                // Revert
                setLocks(prev => prev.map(l =>
                    l.monthStart === monthStart ? { ...l, isLocked: currentStatus } : l
                ));
            }
        });
    };

    const changeYear = (delta: number) => {
        setCurrentYear(prev => prev + delta);
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--text-main)' }}>Admin Dashboard</h2>

            {/* Year Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '32px' }}>
                <button
                    onClick={() => changeYear(-1)}
                    className="btn btn-ghost"
                    style={{ padding: '8px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-main)' }}
                >
                    <ChevronLeft size={32} />
                </button>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{currentYear}</span>
                <button
                    onClick={() => changeYear(1)}
                    className="btn btn-ghost"
                    style={{ padding: '8px', cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-main)' }}
                >
                    <ChevronRight size={32} />
                </button>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>Monthly Schedule Locks</h3>

            {isLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '16px'
                }}>
                    {locks.map((lock) => {
                        const date = new Date(lock.monthStart);
                        return (
                            <div key={lock.monthStart} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '16px',
                                background: 'var(--surface)',
                                border: lock.isLocked ? '1px solid var(--error)' : '1px solid var(--border)',
                                borderRadius: '12px',
                                transition: 'all 0.2s ease',
                                opacity: pending ? 0.7 : 1
                            }}>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-main)' }}>
                                    {format(date, 'MMMM')}
                                </div>

                                <label className="switch" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <div style={{
                                        position: 'relative',
                                        width: '56px',
                                        height: '32px',
                                        background: lock.isLocked ? 'var(--error)' : 'var(--success)',
                                        borderRadius: '32px',
                                        transition: 'background 0.2s',
                                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: '4px',
                                            left: lock.isLocked ? '28px' : '4px',
                                            width: '24px',
                                            height: '24px',
                                            background: 'white',
                                            borderRadius: '50%',
                                            transition: 'left 0.2s',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                        }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.875rem', color: lock.isLocked ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
                                        {lock.isLocked ? 'LOCKED' : 'OPEN'}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={lock.isLocked}
                                        onChange={() => handleToggle(lock.monthStart, lock.isLocked)}
                                        style={{ display: 'none' }}
                                        disabled={pending}
                                    />
                                </label>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
