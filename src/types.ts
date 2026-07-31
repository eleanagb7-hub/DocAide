export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_name: string;
  patient_phone: string | null;
  reason: string | null;
  scheduled_at: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
}

export interface AppointmentWithDoctor extends Appointment {
  doctor: Pick<Doctor, 'id' | 'name' | 'specialty'>;
}
