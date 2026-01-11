"use client";

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { Shift } from '@/app/actions'; // Use real type
import styles from './AvailabilityCalendar.module.css';

interface Props {
    shifts: Shift[];
}

export function ScheduleReview({ shifts }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const getShiftsForDate = (date: Date) => {
        return shifts.filter(s => isSameDay(new Date(s.date), date));
    };

    const activeShifts = selectedDate ? getShiftsForDate(selectedDate) : [];

    const handleMonthChange = (delta: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
        setSelectedDate(null);
    };

    return (
        <div className="flex-col gap-4">
            {/* Calendar Card */}
            <div className="card">
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <button onClick={() => handleMonthChange(-1)} className="btn btn-ghost" aria-label="Previous Month">
                        <ChevronLeft size={24} />
                    </button>
                    <h2 style={{ fontSize: '1.25rem', textAlign: 'center' }}>{format(currentMonth, 'MMMM yyyy')}</h2>
                    <button onClick={() => handleMonthChange(1)} className="btn btn-ghost" aria-label="Next Month">
                        <ChevronRight size={24} />
                    </button>
                </div>

                <div className="grid-calendar" style={{ marginBottom: '8px' }}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <div key={d} style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid-calendar">
                    {days.map((day) => {
                        const dayShifts = getShiftsForDate(day);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const hasShift = dayShifts.length > 0;

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={clsx(
                                    styles.dayCell,
                                    !isCurrentMonth && styles.dimmed,
                                )}
                                style={{
                                    border: isSelected ? '2px solid var(--primary)' : undefined,
                                    backgroundColor: isSelected ? 'var(--primary-light)' : undefined
                                }}
                            >
                                <span className={styles.dateNumber}>{format(day, 'd')}</span>
                                {hasShift && (
                                    <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                                        {/* Simulating dots for shifts */}
                                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)' }} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Details Card */}
            {selectedDate && (
                <div className="card animate-enter">
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
                        {format(selectedDate, 'EEEE, MMMM do')}
                    </h3>

                    {activeShifts.length === 0 ? (
                        <p className="text-muted">No shifts scheduled for this day.</p>
                    ) : (
                        <div className="flex-col gap-4">
                            {activeShifts.map(shift => {
                                // Props should include doctor name, but Shift type from actions only has doctor_id if simplistic
                                // Wait, getShiftsForMonth joins doctors table, so we have data.
                                // let's assume the passed prop has the joined data.
                                // We need to extend the type in this file or cast it.
                                // Let's rely on the fact that we will pass the enriched object.
                                const doctorName = (shift as any).doctors?.full_name || 'Unknown Doctor';
                                const role = (shift as any).doctors?.medical_role || '';

                                return (
                                    <div key={shift.id} style={{
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'var(--background)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div className="flex-col">
                                            <span style={{ fontWeight: 600, fontSize: '1rem' }}>{doctorName}</span>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{role}</span>
                                        </div>
                                        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                                            <span style={{
                                                background: 'var(--primary)',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '999px',
                                                fontWeight: 600,
                                                fontSize: '0.875rem'
                                            }}>
                                                {shift.shift_role}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {!selectedDate && (
                <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>Tap a date to see scheduled shifts.</p>
                </div>
            )}
        </div>
    );
}
