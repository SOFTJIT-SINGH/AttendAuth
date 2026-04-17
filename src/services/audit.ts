import { supabase } from './supabase';
import { AttendanceRecord } from '../types';

export const logAttendance = async (record: any) => {
  const { error } = await supabase.from('attendance_logs').insert({
    student_id: record.student_id,
    class_id: record.class_id,
    status: record.status,
    marked_at: record.marked_at,
    location: record.location,
    device_id: record.device_id,
    ai_confidence: record.ai_confidence,
    distance_km: record.distance_km, // Support for radius auditing
    ip_address: '0.0.0.0', // Placeholder
  });

  if (error) {
    console.error("Audit log failed:", error.message);
    throw new Error(`Audit log failed: ${error.message}`);
  }
};