"use client";

import type { User } from "@/lib/types";
import { useChat } from "@/components/chat/ChatProvider";
import OnlineDot from "@/components/chat/OnlineDot";

type ConversationListProps = {
  users: User[];
  selectedUserId: string | null;
  onSelect: (user: User) => void;
};

//contact list with online dot + unread count, click to open the convo
export default function ConversationList({ users, selectedUserId, onSelect }: ConversationListProps) {
  const { onlineUserIds, unreadCounts } = useChat();

  if (users.length === 0)
    return <p className="p-4 text-sm text-gray-600">Pas encore d'autres utilisateurs.</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <button
            onClick={() => onSelect(user)}
            className={`flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted ${
              selectedUserId === user.id ? "bg-muted font-bold" : ""
            }`}
          >
            <OnlineDot online={onlineUserIds.has(user.id)} />
            <span className="min-w-0 flex-1 truncate">{user.name}</span>
            {unreadCounts[user.id] > 0 && (
              <span
                className="rounded-none bg-red-600 px-2 text-xs font-bold text-white"
                aria-label={`${unreadCounts[user.id]} unread messages`}
              >
                {unreadCounts[user.id]}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
