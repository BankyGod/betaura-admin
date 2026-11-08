import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquare,
  Send,
  RefreshCw,
  Search,
  User,
  Headphones,
  CheckCheck,
  Phone,
  Lock,
} from 'lucide-react';
import { adminApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export default function CustomerCare() {
  const { admin, isSuperAdmin } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  const fetchThreads = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const res = await adminApi.getSupportThreads();
      if (Array.isArray(res.data)) {
        setThreads(res.data);
        if (res.data.length > 0 && !selectedThreadId) {
          setSelectedThreadId(res.data[0].thread_id);
          setActiveThread(res.data[0]);
        } else if (selectedThreadId) {
          const updated = res.data.find((t) => t.thread_id === selectedThreadId);
          if (updated) setActiveThread(updated);
        }
      }
    } catch {
      if (!quiet) setThreads([]);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    fetchThreads(false);
    const interval = setInterval(() => {
      fetchThreads(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages?.length]);

  async function handleSelectThread(thread) {
    setSelectedThreadId(thread.thread_id);
    setActiveThread(thread);
    try {
      const res = await adminApi.getSupportThread(thread.thread_id, true);
      if (res.data && res.data.thread_id) {
        setActiveThread(res.data);
        setThreads((prev) =>
          prev.map((t) =>
            t.thread_id === thread.thread_id ? { ...t, unread_count: 0 } : t
          )
        );
      }
    } catch {
      // keep local activeThread
    }
  }

  async function handleSendReply(e) {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;
    const cleanReply = replyText.trim();
    try {
      setSending(true);
      setReplyText('');
      const res = await adminApi.replySupportThread(activeThread.thread_id, {
        text: cleanReply,
        admin_name: admin?.name || 'Customer Care',
      });
      if (res.data && res.data.thread_id) {
        setActiveThread(res.data);
        setThreads((prev) =>
          prev.map((t) => (t.thread_id === res.data.thread_id ? res.data : t))
        );
      }
    } catch {
      // Restore text if failed
      setReplyText(cleanReply);
    } finally {
      setSending(false);
    }
  }

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.name || '').toLowerCase().includes(q) ||
      (t.username || '').toLowerCase().includes(q) ||
      (t.phone || '').toLowerCase().includes(q) ||
      (t.last_message || '').toLowerCase().includes(q)
    );
  });

  const totalUnread = threads.reduce(
    (sum, t) => sum + Number(t.unread_count || 0),
    0
  );

  if (!isSuperAdmin) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-xs border border-gray-100 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-gray-900">
          Super Admin Authority Only
        </h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Only the Super Admin has authority to view and respond to BetAura Customer Care messages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              Customer Care Inbox
            </h2>
            {totalUnread > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#ff5b5b] text-white text-xs font-extrabold">
                {totalUnread} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Customers and BetAura users who have texted the admins ({threads.length} conversation{threads.length === 1 ? '' : 's'})
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchThreads(false)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Main Split Inbox View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[560px]">
        {/* Left Column: List of Customers Who Texted */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-xs border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 border border-gray-200/70">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer or message..."
                className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-[520px]">
            {loading && filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Loading customer messages...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2d9cdb] flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-800">
                  No Customer Messages Yet
                </p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                  When any user on the BetAura platform texts Customer Support, their name and message will appear here automatically.
                </p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = activeThread?.thread_id === t.thread_id;
                const unread = Number(t.unread_count || 0);
                return (
                  <button
                    key={t.thread_id}
                    type="button"
                    onClick={() => handleSelectThread(t)}
                    className={`w-full text-left p-4 flex items-start gap-3 transition ${
                      isSelected
                        ? 'bg-[#d9f3ea]/40 border-l-4 border-[#00b074]'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#2d9cdb]/15 text-[#2d9cdb] font-extrabold text-sm flex items-center justify-center shrink-0">
                      {(t.name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-extrabold text-gray-900 truncate">
                          {t.name || t.username || t.phone || 'BetAura User'}
                        </p>
                        {unread > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#ff5b5b] text-white text-[10px] font-extrabold shrink-0">
                            {unread} new
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {t.status === 'REPLIED' ? 'Replied' : 'Open'}
                          </span>
                        )}
                      </div>
                      {t.phone && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {t.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 truncate mt-1 font-medium">
                        {t.last_message || 'No messages'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Customer Chat Thread */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-xs border border-gray-100 flex flex-col overflow-hidden">
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#d9f3ea] text-[#00b074] flex items-center justify-center">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">
                Select a Customer to View &amp; Reply
              </h3>
              <p className="text-xs text-gray-400 max-w-sm">
                Click on any customer from the left list to read their messages and reply directly from the Admin Console.
              </p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00b074] text-white font-extrabold text-sm flex items-center justify-center">
                    {(activeThread.name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      {activeThread.name || activeThread.username || 'BetAura User'}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      {activeThread.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#00b074]" />
                          {activeThread.phone}
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        {(activeThread.messages || []).length} message
                        {(activeThread.messages || []).length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    activeThread.status === 'REPLIED'
                      ? 'bg-[#d9f3ea] text-[#00b074]'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {activeThread.status || 'OPEN'}
                </span>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 max-h-[400px] bg-[#f9fafb]">
                {(activeThread.messages || []).map((m) => {
                  const isAgent = m.sender === 'agent';
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 ${
                        isAgent ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isAgent
                            ? 'bg-[#00b074] text-white'
                            : 'bg-[#2d9cdb]/15 text-[#2d9cdb]'
                        }`}
                      >
                        {isAgent ? (
                          <Headphones className="w-3.5 h-3.5" />
                        ) : (
                          <User className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                          isAgent
                            ? 'bg-[#00b074] text-white font-semibold rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        <div
                          className={`text-[10px] mt-1 flex items-center gap-1 ${
                            isAgent ? 'text-white/80 justify-end' : 'text-gray-400'
                          }`}
                        >
                          <span>
                            {m.sender_name ? `${m.sender_name} • ` : ''}
                            {m.timestamp}
                          </span>
                          {isAgent && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Admin Reply Input */}
              <form
                onSubmit={handleSendReply}
                className="p-3.5 border-t border-gray-100 bg-white flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${activeThread.name || 'customer'}...`}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00b074]"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#00b074] hover:bg-[#0a873c] disabled:opacity-50 text-white px-4 py-2.5 text-xs font-extrabold transition shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

