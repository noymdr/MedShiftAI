'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types based on our Schema
export type Doctor = {
    id: string
    full_name: string
    medical_role: 'resident' | 'attending'
    qualification: 'Junior' | 'Intermediate' | 'Senior'
    specialty: string,
    user_id: string
}

export type Shift = {
    id: string
    date: string
    shift_role: 'Junior Resident' | 'Intermediate Resident' | 'Senior Resident' | 'Attending'
    doctor_id: string | null
}

export type DoctorConstraint = {
    doctor_id: string
    date: string
    status: 'vacation' | 'blocked'
}

export async function checkEmailWhitelist(email: string) {
    const supabase = await createClient();
    console.log("Checking whitelist for:", email);

    // Check if user exists
    const { data: user, error } = await supabase
        .from('users')
        .select('id, system_role')
        .eq('email', email)
        .single();

    if (error) {
        console.error("Whitelist Check Error:", error);
        return { allowed: false, error: 'Database verification failed' };
    }

    if (!user) {
        console.log("User not found in whitelist.");
        return { allowed: false, error: 'Email not found in authorized list.' };
    }

    console.log("User found:", user);
    return { allowed: true };
}

export async function getDoctorByEmail(email: string): Promise<Doctor | null> {
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('doctor_id')
        .eq('email', email)
        .single()

    if (userError || !user?.doctor_id) return null

    const { data: doctor, error: docError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', user.doctor_id)
        .single()

    if (docError) return null
    return doctor
}

export async function getMonthAvailability(doctorId: string, monthStart: string, monthEnd: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('doctors_constraints')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('date', monthStart)
        .lte('date', monthEnd)

    if (error) {
        console.error('Error fetching availability:', error)
        return []
    }
    return data
}

// ... imports

// Helper to get month start from a date string (YYYY-MM-DD)
function getMonthStart(dateStr: string) {
    const date = new Date(dateStr);
    // Ensure we send YYYY-MM-01 format to DB
    // Use UTC to avoid timezone shifts affecting the "Month Start" key
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export async function getMonthLockStatus(monthStart: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('schedule_locks')
        .select('is_locked')
        .eq('month_start', monthStart)
        .single();

    if (error || !data) return { isLocked: false }; // Default unlocked if no record? Or Locked? 
    // Requirement: "lock the other user's ability". 
    // Let's assume default is Unlocked unless explicitly Locked? 
    // Schema says Default TRUE... 
    // If no record exists, it usually means nobody touched it. Let's say it's Unlocked by default for UX, 
    // until Admin explicitly creates a lock record.
    return { isLocked: data.is_locked };
}

export async function toggleMonthLock(monthStart: string, isLocked: boolean) {
    const supabase = await createClient();

    // Auth Check: Is User Admin?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) throw new Error("Unauthorized");

    // Fix: Query by email, not ID, since public.users id is different from auth.users id
    const { data: userRecord } = await supabase
        .from('users')
        .select('id, system_role')
        .eq('email', user.email)
        .single();

    if (userRecord?.system_role !== 'admin') {
        throw new Error("Forbidden: Admins only");
    }

    const { error } = await supabase
        .from('schedule_locks')
        .upsert({
            month_start: monthStart,
            is_locked: isLocked,
            updated_by: userRecord.id, // Use the public.users ID for reference
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error("Error toggling lock:", error);
        throw error;
    }
    revalidatePath('/');
}

export async function getLocksForYear(year: number) {
    const supabase = await createClient();
    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const { data, error } = await supabase
        .from('schedule_locks')
        .select('month_start, is_locked')
        .gte('month_start', startOfYear)
        .lte('month_start', endOfYear);

    if (error) {
        console.error("Error fetching year locks:", error);
        return [];
    }
    return data.map(l => ({ monthStart: l.month_start, isLocked: l.is_locked }));
}


export async function updateAvailability(doctorId: string, date: string, status: 'vacation' | 'blocked' | null) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return; // Should handle error

    // 1. Check if User is Admin (Bypass Lock)
    const { data: userRecord } = await supabase
        .from('users')
        .select('system_role')
        .eq('email', user.email)
        .single();

    const isAdmin = userRecord?.system_role === 'admin';

    // 2. Check Lock Status
    const monthStart = getMonthStart(date);
    const { isLocked } = await getMonthLockStatus(monthStart);

    if (isLocked && !isAdmin) {
        // If locked and NOT admin, block update.
        // But what if the user is the Admin updating their own 'resident' profile? 
        // Admin overrides all locks.
        // What if User is updating their own profile?
        // "The admin should have the capability to lock the other user's ability"
        // So regular users are blocked. Admin is not.
        throw new Error("This month is locked for editing.");
    }

    if (status === null) {
        // Remove constraint
        await supabase
            .from('doctors_constraints')
            .delete()
            .match({ doctor_id: doctorId, date: date })
    } else {
        // Upsert constraint
        await supabase
            .from('doctors_constraints')
            .upsert({ doctor_id: doctorId, date: date, status: status }, { onConflict: 'doctor_id,date' })
    }
    revalidatePath('/')
}

export async function getShiftsForMonth(monthStart: string, monthEnd: string) {
    const supabase = await createClient();
    // Join with doctors to get names
    const { data, error } = await supabase
        .from('shifts')
        .select(`
            id,
            date,
            shift_role,
            doctor_id,
            doctors (
                full_name,
                medical_role
            )
        `)
        .gte('date', monthStart)
        .lte('date', monthEnd)

    if (error) {
        console.error("Error fetching shifts", error);
        return [];
    }
    return data;
}
