import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X, DollarSign, TrendingDown, TrendingUp, Receipt, Wallet } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { fetchDoctorByUser, fetchInvoicesByDoctor, fetchExpensesByDoctor, fetchPatients } from '../../lib/queries';
import { StatusBadge, Spinner, EmptyState, formatDateShort } from '../../lib/ui';
import type { Doctor, InvoiceWithDetails, Expense, Patient, InvoiceStatus } from '../../types';

export default function DoctorFinancial() {
  const { profile } = useAuth();
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
    if (!confirm('¿Eliminar esta factura?')) return;
    await supabase.from('invoices').delete().eq('id', id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const deleteExpense = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const stats = [
    { label: 'Ingresos del mes', value: `$${monthIncome.toFixed(2)}`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Gastos del mes', value: `$${monthExpenses.toFixed(2)}`, icon: TrendingDown, color: 'text-red-600 bg-red-50' },
    { label: 'Balance neto', value: `$${netIncome.toFixed(2)}`, icon: Wallet, color: netIncome >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50' },
    { label: 'Pendiente de cobro', value: `$${(pendingIncome + overdueIncome).toFixed(2)}`, icon: Receipt, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Finanzas</h1>
        <p className="text-slate-500 mt-1">Control financiero de tu clínica</p>
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
        {(['overview', 'invoices', 'expenses'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {t === 'overview' ? 'Resumen' : t === 'invoices' ? 'Facturas' : 'Gastos'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Resumen financiero</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
              <span className="text-sm text-slate-700">Ingresos cobrados</span>
              <span className="font-bold text-green-700">${paidIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50">
              <span className="text-sm text-slate-700">Facturas pendientes</span>
              <span className="font-bold text-amber-700">${pendingIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-red-50">
              <span className="text-sm text-slate-700">Facturas vencidas</span>
              <span className="font-bold text-red-700">${overdueIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
              <span className="text-sm text-slate-700">Total de gastos</span>
              <span className="font-bold text-slate-700">${totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg border-2 border-slate-200">
              <span className="font-medium text-slate-900">Balance neto</span>
              <span className={`font-bold ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>${netIncome.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && doctor && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="btn-primary" onClick={() => setShowInvoiceForm(true)}><Plus className="w-4 h-4" /> Nueva factura</button>
          </div>
          {invoices.length === 0 ? (
            <EmptyState icon={Receipt} message="No hay facturas" />
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="card p-4 group">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{inv.patient?.name ?? 'Paciente'}</p>
                      <p className="text-lg font-bold text-slate-900">${Number(inv.amount).toFixed(2)}</p>
                      <p className="text-xs text-slate-400">{formatDateShort(inv.created_at)}{inv.due_date && ` · Vence: ${formatDateShort(inv.due_date)}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={inv.status} type="invoice" />
                      <select className="text-xs rounded-lg border border-slate-200 px-2 py-1.5 text-slate-600 focus:outline-none" value={inv.status} onChange={(e) => updateInvoiceStatus(inv.id, e.target.value as InvoiceStatus)}>
                        <option value="pending">Pendiente</option>
                        <option value="paid">Pagada</option>
                        <option value="overdue">Vencida</option>
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
            <button className="btn-primary" onClick={() => setShowExpenseForm(true)}><Plus className="w-4 h-4" /> Nuevo gasto</button>
          </div>
          {expenses.length === 0 ? (
            <EmptyState icon={DollarSign} message="No hay gastos registrados" />
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => (
                <div key={exp.id} className="card p-4 group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{exp.description || 'Gasto'}</p>
                      <p className="text-sm text-slate-500">{exp.category && `${exp.category} · `}${formatDateShort(exp.expense_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">${Number(exp.amount).toFixed(2)}</span>
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
  const [patientId, setPatientId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    if (!patientId) { setError('Selecciona un paciente'); setSaving(false); return; }
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
          <h2 className="text-lg font-semibold text-slate-900">Nueva factura</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">Paciente *</label>
            <select className="input" required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">Selecciona un paciente</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div><label className="label">Monto *</label><input type="number" step="0.01" className="input" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
          <div><label className="label">Fecha de vencimiento</label><input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear factura'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpenseForm({ doctorId, onClose, onSaved }: { doctorId: string; onClose: () => void; onSaved: () => void }) {
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
          <h2 className="text-lg font-semibold text-slate-900">Nuevo gasto</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div><label className="label">Monto *</label><input type="number" step="0.01" className="input" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
          <div><label className="label">Descripción</label><input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Concepto del gasto" /></div>
          <div><label className="label">Categoría</label><input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ej: Material, Renta, Servicios" /></div>
          <div><label className="label">Fecha</label><input type="date" className="input" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} /></div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear gasto'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
