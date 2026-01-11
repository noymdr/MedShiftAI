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

export async function updateAvailability(doctorId: string, date: string, status: 'vacation' | 'blocked' | null) {
    const supabase = await createClient();
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
