import { supabase } from './supabase';
import { AttendanceRecord } from '../types';

export const logAttendance = async (record: AttendanceRecord) => {
  const { error } = await supabase.from('attendance_logs').insert({
    student_id: record.student_id,
    class_id: record.class_id,
    status: record.status,
    marked_at: record.marked_at,
    location: record.location,
    device_id: record.device_id,
    ai_confidence: record.ai_confidence,
    ip_address: 'CLIENT_SIDE_IP', // In prod, fetch from edge proxy or backend
  });
  if (error) throw new Error(`Audit log failed: ${error.message}`);
};