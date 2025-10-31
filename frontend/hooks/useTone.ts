"use client";

import { useState, useEffect } from "react";
import { Message } from "@/types";

export function useTone(userId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
  const [tone, setTone] = useState<string>("professional");
  const [toneMenuOpen, setToneMenuOpen] = useState<boolean>(false);

  const availableTones: string[] = [
    "professional",
    "casual",
    "enthusiastic",
    "humorous",
    "concise",
    "encouraging",
    "socratic",
    "storyteller"
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/tone/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.tone) setTone(data.tone);
        }
      } catch (err) {
        console.error("Failed to load tone:", err);
      }
    })();
  }, [userId]);

  const changeTone = async (newTone: string) => {
    setToneMenuOpen(false);
    if (newTone === tone) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/tone/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: newTone })
      });
      if (res.ok) {
        setTone(newTone);
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'assistant',
          content: `Tone updated to "${newTone}". I'll use that style going forward.`,
          timestamp: new Date()
        }]);
      } else {
        const err = await res.json();
        console.error("Failed to set tone:", err);
      }
    } catch (e) {
      console.error("Error setting tone:", e);
    }
  };

  return { tone, toneMenuOpen, setToneMenuOpen, availableTones, changeTone };
}
