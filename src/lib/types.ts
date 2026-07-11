export type Role = "cr" | "admin" | "staff";

export type Level = "Certificate" | "Diploma" | "Degree" | "Masters" | "PhD";

export interface User {
  id: number;
  name: string;
  reg_no?: string | null;
  staff_id?: string | null;
  position?: string | null;
  email: string;
  role: Role;
  is_super_admin?: boolean;
  is_main_super_admin?: boolean;
  admin_domain?: "general" | "staff" | null;
  phone?: string;
  campus?: string;
  sex?: "male" | "female" | null;
  faculty?: string;
  department?: string;
  program?: string;
  level?: Level;
  year_of_study?: number | null;
  is_active: boolean;
  approved_at?: string | null;
  created_at?: string;
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
  campus: string;
  capacity: number;
  type: VenueType;
  status: VenueStatus;
  source: "manual" | "timetable_import";
  description: string | null;
  blocked_purposes?: BookingPurpose[] | null;
  restricted_levels?: Level[] | null;
  restricted_department?: string | null;
  restricted_role?: "cr" | "staff" | null;
  free_from?: string;
  free_until?: string;
  occupied_until?: string | null;
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
  reason: string | null;
  status: BookingStatus;
  signature: string | null;
  signed_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at?: string;
  updated_at?: string;
  venue?: Venue;
  user?: User;
  semester?: Semester;
  approver?: User | null;
}

export type NotificationType = "booking_approved" | "booking_rejected" | "booking_pending" | "booking_edited" | "announcement" | "staff_pending" | "cr_pending";

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  booking_id: number | null;
  announcement_id: number | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  booking?: Booking | null;
}

export interface Announcement {
  id: number;
  admin_id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  admin?: User | null;
  notifications_count?: number;
  read_count?: number;
}
