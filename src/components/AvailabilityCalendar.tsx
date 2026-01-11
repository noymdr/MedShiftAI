"use client";

import React, { startTransition, useOptimistic } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Star } from 'lucide-react';
import clsx from 'clsx';
import styles from './AvailabilityCalendar.module.css';
import { updateAvailability } from '@/app/actions';

interface Props {
    currentMonth: Date;
    constraints: Record<string, 'vacation' | 'blocked'>;
    doctorId: string;
    onMonthChange: (delta: number) => void;
}

export function AvailabilityCalendar({ currentMonth, constraints: initialConstraints, doctorId, onMonthChange }: Props) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const today = startOfDay(new Date());

    const monthLabel = format(currentMonth, 'MMMM yyyy');

    const [optimisticConstraints, addOptimisticConstraint] = useOptimistic(
        initialConstraints,
        (state, { date, status }: { date: string, status: 'vacation' | 'blocked' | null }) => {
            const newState = { ...state };
            if (status === null) delete newState[date];
            else newState[date] = status;
            return newState;
        }
    );

    const handleToggleDate = async (dateStr: string) => {
        const current = optimisticConstraints[dateStr];
        let next: 'vacation' | 'blocked' | null = null;

        // Cycle: Available -> Vacation (Blocked) -> Blocked (Vacation?) -> Available
        // Mapping 'unavailable' to 'blocked' and 'preferred' to 'vacation' (or vice versa based on requirement)
        // Request said: status should be "vacation" or "blocked". 
        // Let's assume: 
        // Default -> Vacation -> Blocked -> Default
        if (!current) next = 'vacation';
        else if (current === 'vacation') next = 'blocked';
        else next = null;

        startTransition(() => {
            addOptimisticConstraint({ date: dateStr, status: next });
        });

        await updateAvailability(doctorId, dateStr, next);
    };

    return (
        <div className="card">
            <div className="flex-between" style={{ marginBottom: '16px' }}>
                <button onClick={() => onMonthChange(-1)} className="btn btn-ghost" aria-label="Previous Month">
                    <ChevronLeft size={24} />
                </button>
                <h2 style={{ fontSize: '1.25rem', textAlign: 'center' }}>{monthLabel}</h2>
                <button onClick={() => onMonthChange(1)} className="btn btn-ghost" aria-label="Next Month">
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
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const status = optimisticConstraints[dateStr];
                    const isPast = isBefore(day, today);

                    let statusColor = undefined;
                    let icon = null;

                    if (status === 'blocked') {
                        statusColor = 'var(--error-bg)';
                        icon = <X size={14} color="var(--error)" className={styles.statusIcon} />;
                    } else if (status === 'vacation') {
                        statusColor = 'var(--primary-light)'; // Vacation is usually blue/relaxed? Or maybe success?
                        // Using Primary for vacation
                        icon = <Star size={14} color="var(--primary)" fill="var(--primary)" className={styles.statusIcon} />;
                    }

                    return (
                        <button
                            key={dateStr}
                            onClick={() => !isPast && handleToggleDate(dateStr)}
                            className={clsx(styles.dayCell, !isCurrentMonth && styles.dimmed, isPast && styles.disabled)}
                            style={{ backgroundColor: statusColor }}
                            disabled={isPast}
                            aria-label={`Date ${dateStr}, status ${status}`}
                        >
                            <span className={styles.dateNumber}>{format(day, 'd')}</span>
                            {icon}
                        </button>
                    );
                })}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '24px', justifyContent: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div className="flex-center gap-2">
                    <div style={{ width: 16, height: 16, borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}></div>
                    <span>Available</span>
                </div>
                <div className="flex-center gap-2">
                    <div style={{ width: 16, height: 16, borderRadius: '4px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Star size={12} color="var(--primary)" fill="var(--primary)" />
                    </div>
                    <span>Vacation</span>
                </div>
                <div className="flex-center gap-2">
                    <div style={{ width: 16, height: 16, borderRadius: '4px', background: 'var(--error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={12} color="var(--error)" />
                    </div>
                    <span>Blocked</span>
                </div>
            </div>
        </div>
    );
}
