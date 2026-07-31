import { useEffect, useState, useCallback } from 'react';
import { Send, MessageSquare, Search } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { fetchProfiles } from '../../lib/queries';
import { Spinner, EmptyState, formatDate } from '../../lib/ui';
import type { Profile, Message } from '../../types';

export default function MessagesPage() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    const [profs, msgs] = await Promise.all([fetchProfiles(), fetchMessages(profile.id)]);
    setContacts(profs.filter((p) => p.id !== profile.id));
    setAllMessages(msgs);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const selectContact = (p: Profile) => {
    setSelectedContact(p);
    setMessages(allMessages.filter((m) =>
      (m.sender_id === profile?.id && m.recipient_id === p.id) ||
      (m.sender_id === p.id && m.recipient_id === profile?.id)
    ));
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedContact || !body.trim()) return;
    const { data } = await supabase.from('messages').insert({
      sender_id: profile.id, recipient_id: selectedContact.id, body,
    }).select('*').single();
    if (data) {
      setMessages((prev) => [...prev, data as Message]);
      setAllMessages((prev) => [...prev, data as Message]);
      setBody('');
    }
  };

  const filteredContacts = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
        <p className="text-slate-500 mt-1">Comunicación segura con tus contactos</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 h-[500px]">
        <div className="card p-4 lg:col-span-1 flex flex-col">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto">
            {filteredContacts.map((c) => (
              <button key={c.id} onClick={() => selectContact(c)}
                className={`w-full text-left p-3 rounded-lg transition flex items-center gap-3 ${selectedContact?.id === c.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-slate-500">{c.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.role === 'doctor' ? 'Doctor' : c.role === 'secretary' ? 'Secretaria' : 'Paciente'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card flex flex-col">
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={MessageSquare} message="Selecciona un contacto" />
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{selectedContact.name}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No hay mensajes todavía</p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_id === profile?.id;
                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isMine ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                          <p className="text-sm">{m.body}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>{formatDate(m.created_at, { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2">
                <input className="input flex-1" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe un mensaje..." />
                <button type="submit" className="btn-primary"><Send className="w-4 h-4" /></button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
