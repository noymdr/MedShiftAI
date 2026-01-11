
export interface DoctorProfile {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  specialty: string;
}

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  shiftType: 'AM' | 'PM' | 'Night' | 'On-Call';
  doctorId: string;
}

export type AvailabilityStatus = 'available' | 'unavailable' | 'preferred';

export interface MonthlyAvailability {
  doctorId: string;
  month: string; // YYYY-MM
  // Date string -> Status
  statusMap: Record<string, AvailabilityStatus>;
}

export const CURRENT_USER_ID = "d1"; // Simulating Dr. Sarah Chen

export const DOCTORS: DoctorProfile[] = [
  { id: "d1", name: "Dr. Sarah Chen", role: "Senior Resident", specialty: "Cardiology" },
  { id: "d2", name: "Dr. James Wilson", role: "Attending", specialty: "Internal Med" },
  { id: "d3", name: "Dr. Emily Zhang", role: "Junior Resident", specialty: "Emergency" },
  { id: "d4", name: "Dr. Michael Ross", role: "Fellow", specialty: "Surgery" },
];

// Initial shifts for Feb 2026
export const MOCK_SHIFTS: Shift[] = [
  { id: "s1", date: "2026-02-01", shiftType: "AM", doctorId: "d1" },
  { id: "s2", date: "2026-02-01", shiftType: "PM", doctorId: "d2" },
  { id: "s3", date: "2026-02-02", shiftType: "Night", doctorId: "d1" },
  { id: "s4", date: "2026-02-03", shiftType: "AM", doctorId: "d3" },
  { id: "s5", date: "2026-02-03", shiftType: "PM", doctorId: "d1" },
  { id: "s6", date: "2026-02-05", shiftType: "On-Call", doctorId: "d2" },
];

export const INITIAL_AVAILABILITY: MonthlyAvailability = {
    doctorId: "d1",
    month: "2026-02",
    statusMap: {
      "2026-02-14": "unavailable", // Valentine's day maybe?
      "2026-02-15": "unavailable",
      "2026-02-20": "preferred",
    }
};
