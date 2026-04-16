export type UserRole = 'HOD' | 'TEACHER' | 'STUDENT';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  device_id: string | null;
  face_ref_blob: string | null; // Base64 encrypted
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  status: 'PRESENT' | 'ABSENT' | 'PENDING_APPROVAL';
  marked_at: string;
  location: { lat: number; lon: number };
  device_id: string;
  ai_confidence: number | null;
}

export interface ClassSchedule {
  id: string;
  subject: string;
  teacher_id: string;
  start_time: string; 
  end_time: string;
  geofence_lat: number;
  geofence_lon: number;
  geofence_radius_m: number; 
}