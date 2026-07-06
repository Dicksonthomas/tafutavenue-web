export type Role = "cr" | "admin";

export type Level = "Certificate" | "Diploma" | "Degree" | "Masters" | "PhD";

export interface User {
  id: number;
  name: string;
  reg_no?: string | null;
  email: string;
  role: Role;
  phone?: string;
  faculty?: string;
  department?: string;
  program?: string;
  level?: Level;
  year_of_study?: number | null;
  is_active: boolean;
}

export interface Semester {
  id: number;
  name: string;
  academic_year: string;
  semester_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export type VenueType = "lecture_hall" | "laboratory" | "seminar_room" | "hall" | "other";
export type VenueStatus = "available" | "maintenance" | "disabled";

export interface Venue {
  id: number;
  name: string;
  code: string | null;
  building: string | null;
  faculty: string | null;
  capacity: number;
  type: VenueType;
  status: VenueStatus;
  source: "manual" | "timetable_import";
  description: string | null;
  blocked_purposes?: BookingPurpose[] | null;
  restricted_levels?: Level[] | null;
  restricted_department?: string | null;
  free_from?: string;
  free_until?: string;
}

export interface TimetableSlot {
  id: number;
  venue_id: number;
  semester_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  course_unit: string | null;
  lecturer_name: string | null;
  program: string | null;
  venue?: Venue;
}

export type BookingPurpose = "study_unit" | "test" | "makeup_class" | "meeting" | "other";
export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Booking {
  id: number;
  user_id: number;
  venue_id: number;
  semester_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: BookingPurpose;
  title: string | null;
  status: BookingStatus;
  signature: string | null;
  signed_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  venue?: Venue;
  user?: User;
  semester?: Semester;
}
