'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock, User as UserIcon } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    companyName: string | null;
    role: string;
  };
}

interface RfqChatBoxProps {
  rfqId: string;
  currentUserId: string;
  currentUserName: string;
  userRole: string;
}

export default function RfqChatBox({ rfqId, currentUserId, currentUserName, userRole }: RfqChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.warn('Failed to load RFQ messages:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 15s (reduced from 6s).
    // Pause polling when the tab is hidden to avoid wasted background requests.
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(fetchMessages, 15000);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
      } else {
        // Resume immediately on tab focus so user doesn't wait up to 15s
        fetchMessages();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [rfqId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageContent = input.trim();
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/rfqs/${rfqId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent }),
      });
      if (res.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">RFQ Clarification & Discussion</h3>
            <p className="text-xs text-slate-500">Ask technical questions, tolerances, delivery timeline & specs</p>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {messages.length} message{messages.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Messages List */}
      <div className="p-6 overflow-y-auto max-h-80 min-h-[160px] space-y-3 bg-slate-50/30">
        {fetching && messages.length === 0 ? (
          <div className="flex justify-center items-center h-28 text-slate-400 text-xs">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No messages yet. Send a note to discuss technical requirements or quotes!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {isMe ? 'You' : m.sender.companyName || m.sender.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] shadow-sm ${
                    isMe
                      ? 'bg-sky-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question or clarification message..."
          className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
