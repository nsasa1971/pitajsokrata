"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "../utils/supabase/client";
import type { User } from "@supabase/supabase-js";

interface SessionGroup {
  id: string;
  first_message: string;
  created_at: string;
  last_turn: number;
  is_final: boolean;
}

interface Props {
  user: User | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  currentSessionId: string | null;
}

export default function Sidebar({ user, onSelectSession, onNewChat, currentSessionId }: Props) {
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const supabase = createClient();

  const loadSessions = useCallback(async () => {
    if (!user) return;

    // Grupiši po session_group (prvoj poruci sesije)
    const { data } = await supabase
      .from("chat_sessions")
      .select("id, session_group, message_user, created_at, turn_number, is_final")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Grupiši ručno - svaka sesija je grupisana po session_group
      const groups: Record<string, SessionGroup> = {};
      
      data.forEach((row: any) => {
        const groupId = row.session_group || row.id;
        if (!groups[groupId] || row.turn_number === 1) {
          groups[groupId] = {
            id: groupId,
            first_message: row.message_user?.substring(0, 60) || "Nova sesija",
            created_at: row.created_at,
            last_turn: row.turn_number || 0,
            is_final: row.is_final || false,
          };
        }
      });

      setSessions(Object.values(groups).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);

  // Osveži kad se promeni sesija
  useEffect(() => {
    if (user && currentSessionId) {
      loadSessions();
    }
  }, [currentSessionId, user, loadSessions]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("chat_sessions").delete().eq("session_group", id);
    await supabase.from("chat_sessions").delete().eq("id", id);
    loadSessions();
    if (currentSessionId === id) {
      onNewChat();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-30 h-screen bg-[#0d0d0f] border-r border-gray-800/50 transition-all duration-300 flex flex-col ${
          collapsed ? "w-0 overflow-hidden lg:w-14" : "w-64 lg:w-72"
        }`}
      >
        <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
          {!collapsed && (
            <button
              onClick={() => { onNewChat(); loadSessions(); }}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl px-3 py-2 text-sm font-medium transition-all"
            >
              + Novi razgovor
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gray-300 ml-2 p-1 flex-shrink-0"
          >
            {collapsed ? "☰" : "✕"}
          </button>
        </div>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all text-sm ${
                  currentSessionId === session.id
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                }`}
              >
                <div className="truncate flex-1">
                  {session.first_message}
                  {session.is_final && " ✓"}
                </div>
                <button
                  onClick={(e) => handleDelete(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-2 flex-shrink-0"
                >
                  🗑️
                </button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-8">
                Još nema razgovora.
              </p>
            )}
          </div>
        )}

        {!collapsed && (
          <div className="p-3 border-t border-gray-800/50 text-xs text-gray-500 text-center truncate">
            {user.email}
          </div>
        )}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed lg:relative z-30 top-4 left-4 lg:left-0 bg-[#0d0d0f] border border-gray-800/50 rounded-xl p-2 text-gray-400 hover:text-white"
        >
          ☰
        </button>
      )}
    </>
  );
}