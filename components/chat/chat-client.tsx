"use client";

import { useState } from 'react';

type Props = {
  session?: any;
};

export default function ChatClient({ session }: Props) {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');

  function send() {
    if (!input.trim()) return;
    setMessages((m) => [...m, input.trim()]);
    setInput('');
  }

  return (
    <div className="border rounded-md p-4">
      <div className="mb-4 text-sm text-muted-foreground">Signed in as: {session?.user?.email || 'unknown'}</div>
      <div className="h-64 overflow-y-auto border-b pb-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">No messages yet.</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className="py-1">
              {m}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type a message..."
        />
        <button onClick={send} className="bg-primary text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
