
import { createClient } from "@/lib/supabase/server";
import { getDoctorByEmail, getMonthAvailability, getShiftsForMonth } from "./actions";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { ScheduleReview } from "@/components/ScheduleReview";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string, month?: string }> }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Note: Middleware should handle redirect, but redundancy is safe
  if (!session?.user?.email) {
    redirect("/login");
  }

  const userEmail = session.user.email;
  const doctor = await getDoctorByEmail(userEmail);

  // If user is logged in but not linked to a doctor record, handling it gracefully
  if (!doctor) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <h1>Access Restricted</h1>
        <p>Your account is not linked to a Doctor Profile.</p>
      </div>
    )
  }

  const { tab: activeTab = "schedule", month: monthParam } = await searchParams;
  const currentMonthStr = monthParam || new Date().toISOString(); // Default to now if missing
  const currentMonth = new Date(currentMonthStr);

  // Validate Date
  if (isNaN(currentMonth.getTime())) {
    // Fallback if invalid date
    redirect('/');
  }

  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
  const viewYear = currentMonth.getFullYear();

  // Fetch data based on tab
  let initialConstraints: Record<string, "vacation" | "blocked"> = {};
  let shifts: any[] = [];

  if (activeTab === 'availability') {
    const data = await getMonthAvailability(doctor.id, monthStart, monthEnd);
    // Transform array to record
    data.forEach((c: any) => {
      initialConstraints[c.date] = c.status;
    });
  } else if (activeTab === 'schedule') {
    shifts = await getShiftsForMonth(monthStart, monthEnd);
  }

  // Client Component Wrapper needed for Tab Switching state? 
  // Actually, let's keep the page server-side and use a client wrapper for the interactive parts 
  // or pass data to the client components.
  // For the Tab Switcher, we can use Link with searchParams or a client component holding state.
  // Given the previous implementation used SetState for tabs, let's create a ClientWrapper.

  // Fetch locks for the Year of the VIEWED month (to ensure Admin Panel works for that year too)
  const startOfYear = `${viewYear}-01-01`;
  const endOfYear = `${viewYear}-12-31`;

  const { data: locksData } = await supabase
    .from('schedule_locks')
    .select('month_start, is_locked')
    .gte('month_start', startOfYear)
    .lte('month_start', endOfYear);

  const initialLocks = locksData?.map(l => ({ monthStart: l.month_start, isLocked: l.is_locked })) || [];

  // Also pass constraints, etc.
  // Determine if User is Admin
  const { data: userData } = await supabase
    .from('users')
    .select('system_role')
    .eq('email', userEmail)
    .single();

  const isAdmin = userData?.system_role === 'admin';

  const validTabs = ['availability', 'schedule', 'admin'];
  const currentTab = validTabs.includes(activeTab) ? activeTab as 'availability' | 'schedule' | 'admin' : 'availability';

  return (
    <DashboardClient
      doctor={doctor}
      initialConstraints={initialConstraints}
      initialShifts={shifts}
      isAdmin={isAdmin}
      initialLocks={initialLocks}
      currentMonthStr={currentMonthStr}
      currentTab={currentTab}
    />
  );
}

// We need to extract the client logic to a separate file to use hooks (useState)
// but pass the Server Data as props.
import { DashboardClient } from "@/components/DashboardClient";
