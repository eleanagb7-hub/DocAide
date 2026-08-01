import { useEffect, useState, useCallback, useRef } from 'react';
import { Send, MessageSquare, Search, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { fetchProfiles, fetchMessages } from '../../lib/queries';
import { Spinner, formatDate } from '../../lib/ui';
import type { Profile, Message, UserRole } from '../../types';

const ROLE_LABELS: Record<UserRole, string> = {
  doctor: 'Doctor',
  secretary: 'Secretaria',
  patient: 'Paciente',
};

export default function MessagesPage() {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const [profs, msgs] = await Promise.all([fetchProfiles(), fetchMessages(profile.id)]);
    setContacts(profs.filter((p) => p.id !== profile.id));
    setAllMessages(msgs);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectContact = (p: Profile) => {
    setSelectedContact(p);
    setMessages(allMessages.filter((m) =>
      (m.sender_id === profile?.id && m.recipient_id === p.id) ||
      (m.sender_id === p.id && m.recipient_id === profile?.id)
    ));
    setMobileView('chat');
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

      <div className="grid lg:grid-cols-3 gap-0 lg:gap-5 h-[600px] lg:h-[550px]">
        {/* Contact list */}
        <div className={`card p-0 lg:p-4 lg:col-span-1 flex flex-col overflow-hidden ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 lg:p-0 lg:mb-3 border-b lg:border-0 border-slate-100">
            <h2 className="font-semibold text-slate-900 text-sm mb-2 lg:hidden">Contactos</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" placeholder="Buscar contacto..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto px-2 lg:px-0 pb-2">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No hay contactos disponibles</p>
              </div>
            ) : (
              filteredContacts.map((c) => {
                const lastMsg = [...allMessages]
                  .filter((m) =>
                    (m.sender_id === profile?.id && m.recipient_id === c.id) ||
                    (m.sender_id === c.id && m.recipient_id === profile?.id)
                  )
                  .pop();
                return (
                  <button key={c.id} onClick={() => selectContact(c)}
                    className={`w-full text-left p-3 rounded-lg transition flex items-center gap-3 ${selectedContact?.id === c.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {lastMsg ? lastMsg.body : ROLE_LABELS[c.role]}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`lg:col-span-2 card flex flex-col overflow-hidden ${mobileView === 'contacts' ? 'hidden lg:flex' : 'flex'}`}>
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <MessageSquare className="w-14 h-14 mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">Selecciona un contacto para empezar a chatear</p>
                <p className="text-slate-300 text-sm mt-1">Elige una persona de la lista de contactos</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <button onClick={() => setMobileView('contacts')} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 -ml-1">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">{selectedContact.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedContact.name}</p>
                  <p className="text-xs text-slate-400">{ROLE_LABELS[selectedContact.role]}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-center text-slate-400 text-sm py-8">
                      No hay mensajes todavía.
                      <br />
                      Escribe el primer mensaje abajo.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.sender_id === profile?.id;
                    return (
                      <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-blue-600 text-white' : 'bg-white text-slate-900 border border-slate-100'}`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={`text-xs mt-1 ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>{formatDate(m.created_at, { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
                <input className="input flex-1" value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Escribe un mensaje a ${selectedContact.name}...`} />
                <button type="submit" className="btn-primary px-4 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
