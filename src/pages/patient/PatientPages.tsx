import { useEffect, useState } from 'react';
import { ClipboardList, FileText, Pill, Receipt } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useSettings } from '../../lib/settings';
import { supabase } from '../../lib/supabase';
import { fetchPatientByUser } from '../../lib/queries';
import { Spinner, EmptyState, formatDate, StatusBadge, formatDateShort } from '../../lib/ui';
import type { Patient, MedicalRecord, Prescription, InvoiceWithDetails } from '../../types';

export function PatientRecords() {
  const { profile } = useAuth();
  const { t } = useSettings();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const pat = await fetchPatientByUser(profile.id);
      if (pat) {
        const { data } = await supabase.from('medical_records').select('*').eq('patient_id', pat.id).order('created_at', { ascending: false });
        setRecords(data as MedicalRecord[] ?? []);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('records.patientRecords')}</h1>
        <p className="text-slate-500 mt-1">{t('records.patientRecordsSubtitle')}</p>
      </div>
      {records.length === 0 ? (
        <EmptyState icon={ClipboardList} message={t('records.noRecordsAvailable')} />
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="card p-4">
              <p className="text-sm text-slate-400 mb-2">{formatDate(r.created_at)}</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.evolution}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PatientPrescriptions() {
  const { profile } = useAuth();
  const { t } = useSettings();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const pat = await fetchPatientByUser(profile.id);
      if (pat) {
        const { data } = await supabase.from('prescriptions').select('*').eq('patient_id', pat.id).order('created_at', { ascending: false });
        setPrescriptions(data as Prescription[] ?? []);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('prescriptions.myPrescriptions')}</h1>
        <p className="text-slate-500 mt-1">{t('prescriptions.myPrescriptionsSubtitle')}</p>
      </div>
      {prescriptions.length === 0 ? (
        <EmptyState icon={Pill} message={t('prescriptions.noPrescriptionsYou')} />
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{p.medication}</p>
                  {p.dosage && <p className="text-sm text-slate-600">{p.dosage}</p>}
                  {p.instructions && <p className="text-sm text-slate-500 mt-1">{p.instructions}</p>}
                  <p className="text-xs text-slate-400 mt-1">{formatDate(p.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PatientInvoices() {
  const { profile } = useAuth();
  const { t, formatCurrency } = useSettings();
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const pat = await fetchPatientByUser(profile.id);
      if (pat) {
        const { data } = await supabase.from('invoices').select('*, patient:patients(id, name)').eq('patient_id', pat.id).order('created_at', { ascending: false });
        setInvoices(data as unknown as InvoiceWithDetails[]);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const totalPending = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('invoices.myInvoices')}</h1>
        <p className="text-slate-500 mt-1">{t('invoices.myInvoicesSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
          <p className="text-sm text-slate-500">{t('invoices.totalPaid')}</p>
        </div>
        <div className="card p-4">
          <p className="text-xl font-bold text-amber-700">{formatCurrency(totalPending)}</p>
          <p className="text-sm text-slate-500">{t('invoices.totalPending')}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} message={t('invoices.noInvoicesYou')} />
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="card p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-900">{formatCurrency(Number(inv.amount))}</p>
                  <p className="text-xs text-slate-400">{formatDateShort(inv.created_at)}{inv.due_date && ` · ${t('invoices.dueDate')}: ${formatDateShort(inv.due_date)}`}</p>
                </div>
                <StatusBadge status={inv.status} type="invoice" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
