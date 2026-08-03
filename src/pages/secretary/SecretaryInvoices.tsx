import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X, Receipt, Search } from 'lucide-react';
import { useSettings } from '../../lib/settings';
import { supabase } from '../../lib/supabase';
import { fetchAllInvoices, fetchAllDoctors, fetchPatients } from '../../lib/queries';
import { StatusBadge, Spinner, EmptyState, formatDateShort } from '../../lib/ui';
import type { InvoiceWithDetails, Doctor, Patient, InvoiceStatus } from '../../types';

export default function SecretaryInvoices() {
  const { t, formatCurrency } = useSettings();
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const [invs, docs, pats] = await Promise.all([fetchAllInvoices(), fetchAllDoctors(), fetchPatients()]);
    setInvoices(invs); setDoctors(docs); setPatients(pats);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices.filter((i) => {
    const matchesSearch = i.patient?.name?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const matchesStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (id: string, status: InvoiceStatus) => {
    await supabase.from('invoices').update({ status }).eq('id', id);
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.delete'))) return;
    await supabase.from('invoices').delete().eq('id', id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('invoices.title')}</h1>
          <p className="text-slate-500 mt-1">{t('invoices.subtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="w-4 h-4" /> {t('invoices.newInvoice')}</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder={t('invoices.searchPatient')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[160px]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">{t('invoices.allStatuses')}</option>
          <option value="pending">{t('status.pending')}</option>
          <option value="paid">{t('status.paid')}</option>
          <option value="overdue">{t('status.overdue')}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} message={t('invoices.noInvoices')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div key={inv.id} className="card p-4 group">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{inv.patient?.name ?? t('role.patient')}</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(inv.amount))}</p>
                  <p className="text-xs text-slate-400">{formatDateShort(inv.created_at)}{inv.due_date && ` · ${t('invoices.dueDate')}: ${formatDateShort(inv.due_date)}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inv.status} type="invoice" />
                  <select className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:outline-none" value={inv.status} onChange={(e) => updateStatus(inv.id, e.target.value as InvoiceStatus)}>
                    <option value="pending">{t('status.pending')}</option>
                    <option value="paid">{t('status.paid')}</option>
                    <option value="overdue">{t('status.overdue')}</option>
                  </select>
                  <button onClick={() => handleDelete(inv.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <InvoiceForm doctors={doctors} patients={patients} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function InvoiceForm({ doctors, patients, onClose, onSaved }: { doctors: Doctor[]; patients: Patient[]; onClose: () => void; onSaved: () => void }) {
  const { t } = useSettings();
  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    if (!doctorId || !patientId) { setError(t('financial.selectBoth')); setSaving(false); return; }
    const { error } = await supabase.from('invoices').insert({
      doctor_id: doctorId, patient_id: patientId,
      amount: parseFloat(amount) || 0, status: 'pending',
      due_date: dueDate || null,
    });
    if (error) { setError(error.message); setSaving(false); } else { onSaved(); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t('invoices.newInvoice')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">{t('role.doctor')} {t('common.required')}</label>
            <select className="input" required value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">{t('financial.selectDoctor')}</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.specialty}</option>)}
            </select>
          </div>
          <div><label className="label">{t('agenda.patient')} {t('common.required')}</label>
            <select className="input" required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">{t('financial.selectPatient')}</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="label">{t('financial.amount')} {t('common.required')}</label><input type="number" step="0.01" className="input" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
          <div><label className="label">{t('financial.dueDate')}</label><input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.saving') : t('financial.createInvoice')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
