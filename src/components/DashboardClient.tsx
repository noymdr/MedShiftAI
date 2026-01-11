"use client";

import { useState } from "react";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { ScheduleReview } from "@/components/ScheduleReview";
import { Doctor } from "@/app/actions";

interface Props {
    doctor: Doctor;
    initialConstraints: Record<string, "vacation" | "blocked">;
    initialShifts: any[];
}

export function DashboardClient({ doctor, initialConstraints, initialShifts }: Props) {
    const [activeTab, setActiveTab] = useState<'availability' | 'schedule'>('availability');
    const [viewMonth, setViewMonth] = useState(new Date());

    const handleMonthChange = (delta: number) => {
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
        // In a real server-component architecture with URL state, we would router.push(`?month=...`)
        // But for this hybrid approach, we might just keep local state and maybe refetch if valid.
        // Since props are 'initial', changing month locally won't fetch new data unless we use server actions or SWR.
        // For this step, let's assume we stick to the initial loaded month or implement fetch on change.
        // To keep it simple: We just change the view. The calendar component handles formatting.
        // Ideally, AvailabilityCalendar should trigger a data fetch if it moves outside the loaded range.
    };

    return (
        <div className="container" style={{ paddingBottom: '80px', paddingTop: '16px' }}>
            {/* Header */}
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
                gridTemplateColumns: '1fr 1fr',
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
                    My Availability
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
                    View Schedule
                </button>
            </div>

            <main className="animate-enter">
                {activeTab === 'availability' ? (
                    <>
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '8px', color: 'var(--text-main)' }}>Update Availability</h2>
                            <p style={{ fontSize: '1rem' }}>Tap dates to mark <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Vacation</span> or <span style={{ color: 'var(--error)', fontWeight: 600 }}>Blocked</span>.</p>
                        </div>
                        <AvailabilityCalendar
                            currentMonth={viewMonth}
                            constraints={initialConstraints}
                            doctorId={doctor.id}
                            onMonthChange={handleMonthChange}
                        />
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Shift Schedule</h2>
                            <p style={{ fontSize: '1rem' }}>View upcoming shifts.</p>
                        </div>
                        <ScheduleReview shifts={initialShifts} />
                    </>
                )}
            </main>
        </div>
    );
}
