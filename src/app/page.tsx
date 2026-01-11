
import { createClient } from "@/lib/supabase/server";
import { getDoctorByEmail, getMonthAvailability, getShiftsForMonth } from "./actions";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { ScheduleReview } from "@/components/ScheduleReview";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default async function Home({ searchParams }: { searchParams: { tab?: string, month?: string } }) {
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

  const activeTab = searchParams?.tab || "availability";
  const currentMonthStr = searchParams?.month || new Date().toISOString();
  const currentMonth = new Date(currentMonthStr);

  const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  // Fetch data based on tab
  let initialConstraints: Record<string, "vacation" | "blocked"> = {};
  let shifts: any[] = [];

  if (activeTab === 'availability') {
    const data = await getMonthAvailability(doctor.id, monthStart, monthEnd);
    // Transform array to record
    data.forEach((c: any) => {
      initialConstraints[c.date] = c.status;
    });
  } else {
    shifts = await getShiftsForMonth(monthStart, monthEnd);
  }

  // Client Component Wrapper needed for Tab Switching state? 
  // Actually, let's keep the page server-side and use a client wrapper for the interactive parts 
  // or pass data to the client components.
  // For the Tab Switcher, we can use Link with searchParams or a client component holding state.
  // Given the previous implementation used SetState for tabs, let's create a ClientWrapper.

  return (
    <DashboardClient
      doctor={doctor}
      initialConstraints={initialConstraints}
      initialShifts={shifts}
    />
  );
}

// We need to extract the client logic to a separate file to use hooks (useState)
// but pass the Server Data as props.
import { DashboardClient } from "@/components/DashboardClient";
