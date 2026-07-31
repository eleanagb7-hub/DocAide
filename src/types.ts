export type UserRole = 'doctor' | 'secretary' | 'patient';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'in_person' | 'teleconsult';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  bio: string | null;
  consultation_fee: number;
  active: boolean;
  created_at: string;
}

export interface DoctorWithProfile extends Doctor {
  profiles: { name: string; phone: string | null } | null;
}

export interface Patient {
  id: string;
  user_id: string | null;
  name: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  emergency_contact: string | null;
  inactive: boolean;
  primary_doctor_id: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  created_by: string | null;
  scheduled_at: string;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string | null;
  notes: string | null;
  teleconsult_link: string | null;
  created_at: string;
}

export interface AppointmentWithDetails extends Appointment {
  doctor: Doctor | null;
  patient: Patient | null;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  evolution: string;
  created_at: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  medication: string;
  dosage: string | null;
  instructions: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  amount: number;
  status: InvoiceStatus;
  due_date: string | null;
  created_at: string;
}

export interface InvoiceWithDetails extends Invoice {
  patient: Pick<Patient, 'id' | 'name'> | null;
}

export interface Expense {
  id: string;
  doctor_id: string;
  amount: number;
  description: string | null;
  category: string | null;
  expense_date: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
}
