import { supabase } from './supabase';
import type { Doctor, Patient, AppointmentWithDetails, InvoiceWithDetails, MedicalRecord, Prescription, Expense, Message, Profile } from '../types';

export async function fetchDoctorByUser(userId: string): Promise<Doctor | null> {
  const { data } = await supabase.from('doctors').select('*').eq('user_id', userId).maybeSingle();
  return data as Doctor | null;
}

export async function fetchAllDoctors(): Promise<Doctor[]> {
  const { data } = await supabase.from('doctors').select('*').order('created_at');
  return (data ?? []) as Doctor[];
}

export async function fetchPatients(): Promise<Patient[]> {
  const { data } = await supabase.from('patients').select('*').order('name');
  return (data ?? []) as Patient[];
}

export async function fetchAppointmentsByDoctor(doctorId: string): Promise<AppointmentWithDetails[]> {
  const { data } = await supabase
    .from('appointments')
    .select('*, doctor:doctors(*), patient:patients(*)')
    .eq('doctor_id', doctorId)
    .order('scheduled_at', { ascending: true });
  return (data ?? []) as unknown as AppointmentWithDetails[];
}

export async function fetchAllAppointments(): Promise<AppointmentWithDetails[]> {
  const { data } = await supabase
    .from('appointments')
    .select('*, doctor:doctors(*), patient:patients(*)')
    .order('scheduled_at', { ascending: true });
  return (data ?? []) as unknown as AppointmentWithDetails[];
}

export async function fetchAppointmentsByPatient(patientId: string): Promise<AppointmentWithDetails[]> {
  const { data } = await supabase
    .from('appointments')
    .select('*, doctor:doctors(*), patient:patients(*)')
    .eq('patient_id', patientId)
    .order('scheduled_at', { ascending: true });
  return (data ?? []) as unknown as AppointmentWithDetails[];
}

export async function fetchInvoicesByDoctor(doctorId: string): Promise<InvoiceWithDetails[]> {
  const { data } = await supabase
    .from('invoices')
    .select('*, patient:patients(id, name)')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as InvoiceWithDetails[];
}

export async function fetchInvoicesByPatient(patientId: string): Promise<InvoiceWithDetails[]> {
  const { data } = await supabase
    .from('invoices')
    .select('*, patient:patients(id, name)')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as InvoiceWithDetails[];
}

export async function fetchAllInvoices(): Promise<InvoiceWithDetails[]> {
  const { data } = await supabase
    .from('invoices')
    .select('*, patient:patients(id, name)')
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as InvoiceWithDetails[];
}

export async function fetchMedicalRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
  const { data } = await supabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return (data ?? []) as MedicalRecord[];
}

export async function fetchPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
  const { data } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  return (data ?? []) as Prescription[];
}

export async function fetchExpensesByDoctor(doctorId: string): Promise<Expense[]> {
  const { data } = await supabase
    .from('expenses')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('expense_date', { ascending: false });
  return (data ?? []) as Expense[];
}

export async function fetchMessages(userId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: true });
  return (data ?? []) as Message[];
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*').order('name');
  return (data ?? []) as Profile[];
}

export async function fetchPatientByUser(userId: string): Promise<Patient | null> {
  const { data } = await supabase.from('patients').select('*').eq('user_id', userId).maybeSingle();
  return data as Patient | null;
}
