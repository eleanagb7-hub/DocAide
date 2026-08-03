import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X, DollarSign, TrendingDown, TrendingUp, Receipt, Wallet } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useSettings } from '../../lib/settings';
import { supabase } from '../../lib/supabase';
import { fetchDoctorByUser, fetchInvoicesByDoctor, fetchExpensesByDoctor, fetchPatients } from '../../lib/queries';
import { StatusBadge, Spinner, EmptyState, formatDateShort } from '../../lib/ui';
import type { Doctor, InvoiceWithDetails, Expense, Patient, InvoiceStatus } from '../../types';

export default function DoctorFinancial() {
  const { profile } = useAuth();
  const { t, formatCurrency } = useSettings();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'invoices' | 'expenses'>('overview');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const doc = await fetchDoctorByUser(profile.id);
    setDoctor(doc);
    if (doc) {
      const [invs, exps, pats] = await Promise.all([
        fetchInvoicesByDoctor(doc.id),
        fetchExpensesByDoctor(doc.id),
        fetchPatients(),
      ]);
      setInvoices(invs); setExpenses(exps); setPatients(pats);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const paidIncome = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const pendingIncome = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0);
  const overdueIncome = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netIncome = paidIncome - totalExpenses;

  const now = new Date();
  const monthExpenses = expenses.filter((e) => new Date(e.expense_date).getMonth() === now.getMonth() && new Date(e.expense_date).getFullYear() === now.getFullYear()).reduce((s, e) => s + Number(e.amount), 0);
  const monthIncome = invoices.filter((i) => i.status === 'paid' && new Date(i.created_at).getMonth() === now.getMonth() && new Date(i.created_at).getFullYear() === now.getFullYear()).reduce((s, i) => s + Number(i.amount), 0);

  const updateInvoiceStatus = async (id: string, status: InvoiceStatus) => {
    await supabase.from('invoices').update({ status }).eq('id', id);
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm(t('common.delete'))) return;
    await supabase.from('invoices').delete().eq('id', id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const deleteExpense = async (id: string) => {
    if (!confirm(t('common.delete'))) return;
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const stats = [
    { label: t('financial.monthIncome'), value: formatCurrency(monthIncome), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: t('financial.monthExpenses'), value: formatCurrency(monthExpenses), icon: TrendingDown, color: 'text-red-600 bg-red-50' },
    { label: t('financial.netBalance'), value: formatCurrency(netIncome), icon: Wallet, color: netIncome >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50' },
    { label: t('financial.pendingCollect'), value: formatCurrency(pendingIncome + overdueIncome), icon: Receipt, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('financial.title')}</h1>
        <p className="text-slate-500 mt-1">{t('financial.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
        {(['overview', 'invoices', 'expenses'] as const).map((t2) => (
          <button key={t2} onClick={() => setTab(t2)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === t2 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {t2 === 'overview' ? t('financial.overview') : t2 === 'invoices' ? t('financial.invoices') : t('financial.expenses')}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">{t('financial.financialSummary')}</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
              <span className="text-sm text-slate-700">{t('financial.collectedIncome')}</span>
              <span className="font-bold text-green-700">{formatCurrency(paidIncome)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50">
              <span className="text-sm text-slate-700">{t('financial.pendingInvoices')}</span>
              <span className="font-bold text-amber-700">{formatCurrency(pendingIncome)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm text-slate-700">{t('financial.overdueInvoices')}</span>
              <span className="font-bold text-red-700">{formatCurrency(overdueIncome)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
              <span className="text-sm text-slate-700">{t('financial.totalExpenses')}</span>
              <span className="font-bold text-slate-700">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border-2 border-slate-200">
              <span className="font-medium text-slate-900">{t('financial.netBalance')}</span>
              <span className={`font-bold ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(netIncome)}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && doctor && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setShowInvoiceForm(true)}><Plus className="w-4 h-4" /> {t('financial.newInvoice')}</button>
          </div>
          {invoices.length === 0 ? (
            <EmptyState icon={Receipt} message={t('financial.noInvoices')} />
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="card p-4 group">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{inv.patient?.name}</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(Number(inv.amount))}</p>
                      <p className="text-xs text-slate-400">{formatDateShort(inv.created_at)}{inv.due_date && ` · ${t('invoices.dueDate')}: ${formatDateShort(inv.due_date)}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={inv.status} type="invoice" />
                      <select className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:outline-none" value={inv.status} onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}>
                        <option value="pending">{t('status.pending')}</option>
                        <option value="paid">{t('status.paid')}</option>
                        <option value="overdue">{t('status.overdue')}</option>
                      </select>
                      <button onClick={() => deleteInvoice(inv.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'expenses' && doctor && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setShowExpenseForm(true)}><Plus className="w-4 h-4" /> {t('financial.newExpense')}</button>
          </div>
          {expenses.length === 0 ? (
            <EmptyState icon={DollarSign} message={t('financial.noExpenses')} />
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => (
                <div key={exp.id} className="card p-4 group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{exp.description || t('financial.expense')}</p>
                      <p className="text-sm text-slate-500">{exp.category && `${exp.category} · `}{formatDateShort(exp.expense_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">{formatCurrency(Number(exp.amount))}</span>
                      <button onClick={() => deleteExpense(exp.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showInvoiceForm && doctor && (
        <InvoiceForm doctorId={doctor.id} patients={patients} onClose={() => setShowInvoiceForm(false)} onSaved={() => { setShowInvoiceForm(false); load(); }} />
      )}
      {showExpenseForm && doctor && (
        <ExpenseForm doctorId={doctor.id} onClose={() => setShowExpenseForm(false)} onSaved={() => { setShowExpenseForm(false); load(); }} />
      )}
    </div>
  );
}

function InvoiceForm({ doctorId, patients, onClose, onSaved }: { doctorId: string; patients: Patient[]; onClose: () => void; onSaved: () => void }) {
  const { t } = useSettings();
  const [patientId, setPatientId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    if (!patientId) { setError(t('financial.selectPatient')); setSaving(false); return; }
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
          <h2 className="text-lg font-semibold text-slate-900">{t('financial.newInvoice')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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

function ExpenseForm({ doctorId, onClose, onSaved }: { doctorId: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useSettings();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const { error } = await supabase.from('expenses').insert({
      doctor_id: doctorId, amount: parseFloat(amount) || 0,
      description: description || null, category: category || null,
      expense_date: expenseDate,
    });
    if (error) { setError(error.message); setSaving(false); } else { onSaved(); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{t('financial.newExpense')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">{t('financial.amount')} {t('common.required')}</label><input type="number" step="0.01" className="input" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
          <div><label className="label">{t('financial.description')}</label><input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('financial.descriptionPlaceholder')} /></div>
          <div><label className="label">{t('financial.category')}</label><input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('financial.categoryPlaceholder')} /></div>
          <div><label className="label">{t('financial.date')}</label><input type="date" className="input" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} /></div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? t('common.saving') : t('financial.createExpense')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
