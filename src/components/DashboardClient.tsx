"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { ScheduleReview } from "@/components/ScheduleReview";
import { AdminPanel } from "@/components/AdminPanel";
import { Doctor } from "@/app/actions";
import { format } from "date-fns";

interface Props {
    doctor: Doctor;
    initialConstraints: Record<string, "vacation" | "blocked">;
    initialShifts: any[];
    isAdmin: boolean;
    initialLocks: { monthStart: string; isLocked: boolean }[];
    currentMonthStr: string; // New prop
    currentTab: 'availability' | 'schedule' | 'admin';
}

export function DashboardClient({ doctor, initialConstraints, initialShifts, isAdmin, initialLocks, currentMonthStr, currentTab }: Props) {
    const router = useRouter();
    const [activeTab, setActiveTabState] = useState(currentTab);

    // Parse the passed currentMonthStr
    const viewMonth = new Date(currentMonthStr);

    const setActiveTab = (tab: 'availability' | 'schedule' | 'admin') => {
        setActiveTabState(tab);
        const params = new URLSearchParams(window.location.search);
        params.set('tab', tab);
        // Ensure month is preserved in URL
        if (!params.get('month')) {
            params.set('month', format(viewMonth, 'yyyy-MM-dd'));
        }
        router.push(`/?${params.toString()}`);
    };

    const handleMonthChange = (delta: number) => {
        const newDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
        const newMonthStr = format(newDate, 'yyyy-MM-dd');
        // Preserve active tab? Ideally yes, but maybe simpler to just set param
        // If we want to keep tab valid, we might need to sync tab to URL too or just let it stay in state.
        // Keeping tab in state is fine for now as it doesn't affect data fetching (except fetching different types of data... wait).
        // page.tsx fetches data based on tab AND month.
        // So we SHOULD update URL with tab as well if we want full persistence.
        // But for "month lock" issue, month is key.
        const params = new URLSearchParams(window.location.search);
        params.set('month', newMonthStr);
        params.set('tab', activeTab); // Sync tab to URL to ensure Page fetches correct data ( Shifts vs Constraints)
        router.push(`/?${params.toString()}`);
    };

    // Determine lock status for the current view month
    const currentMonthStart = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const currentLock = initialLocks.find(l => l.monthStart === currentMonthStart);
    const isLocked = currentLock ? currentLock.isLocked : false; // Default Open

    // Admin Override Logic
    const isRestricted = isLocked && !isAdmin;

    return (
        <div className="container" style={{ paddingBottom: '80px', paddingTop: '16px' }}>
            {/* ... Header ... */}
            <header style={{
                height: 'var(--header-height)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: 40, height: 40, background: 'var(--primary)', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.2rem'
                    }}>
                        M
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>MedShift</h1>
                </div>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: 'white',
                    border: '2px solid var(--primary-light)',
                    color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                    overflow: 'hidden'
                }}>
                    {/* Initials */}
                    {doctor.full_name ? doctor.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'DR'}
                </div>
            </header>

            {/* Navigation Tabs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isAdmin ? '1fr 1fr 1fr' : '1fr 1fr',
                background: 'var(--surface)',
                padding: '4px',
                borderRadius: '16px',
                marginBottom: '32px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                border: '1px solid var(--border)'
            }}>
                <button
                    onClick={() => setActiveTab('availability')}
                    style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'availability' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'availability' ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.95rem'
                    }}
                >
                    Availability
                </button>
                <button
                    onClick={() => setActiveTab('schedule')}
                    style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'schedule' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'schedule' ? 'white' : 'var(--text-secondary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.95rem'
                    }}
                >
                    Schedule
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('admin')}
                        style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === 'admin' ? 'var(--primary)' : 'transparent',
                            color: activeTab === 'admin' ? 'white' : 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '0.95rem'
                        }}
                    >
                        Admin
                    </button>
                )}
            </div>

            <main className="animate-enter">
                {activeTab === 'availability' ? (
                    <>
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '8px', color: 'var(--text-main)' }}>Update Availability</h2>
                            {isRestricted ? (
                                <div style={{
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    background: 'var(--error-bg)',
                                    color: 'var(--error)',
                                    borderRadius: '8px',
                                    fontWeight: 600
                                }}>
                                    Month Locked by Admin
                                </div>
                            ) : (
                                <>
                                    {isLocked && isAdmin && (
                                        <div style={{
                                            display: 'inline-block',
                                            marginBottom: '8px',
                                            padding: '4px 12px',
                                            background: '#fff3cd',
                                            color: '#856404',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            Locked (Admin Override)
                                        </div>
                                    )}
                                    <p style={{ fontSize: '1rem' }}>Tap dates to mark <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Vacation</span> or <span style={{ color: 'var(--error)', fontWeight: 600 }}>Blocked</span>.</p>
                                </>
                            )}
                        </div>
                        <AvailabilityCalendar
                            currentMonth={viewMonth}
                            constraints={initialConstraints}
                            doctorId={doctor.id}
                            onMonthChange={handleMonthChange}
                            isLocked={isRestricted}
                        />
                    </>
                ) : activeTab === 'schedule' ? (
                    <>
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Shift Schedule</h2>
                            <p style={{ fontSize: '1rem' }}>View upcoming shifts.</p>
                        </div>
                        <ScheduleReview shifts={initialShifts} />
                    </>
                ) : (
                    <AdminPanel initialLocks={initialLocks} />
                )}
            </main>
        </div>
    );
}
