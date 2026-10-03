"use client";

import type { User } from "@/lib/types";
import { useOnlineUsers } from "@/components/chat/ChatProvider";
import OnlineDot from "@/components/chat/OnlineDot";

type ConversationListProps = {
  users: User[];
  selectedUserId: string | null;
  onSelect: (user: User) => void;
};

// liste des contacts avec leur pastille en ligne ; un clic ouvre la conversation
export default function ConversationList({ users, selectedUserId, onSelect }: ConversationListProps) {
  const onlineUserIds = useOnlineUsers();

  if (users.length === 0)
    return <p className="p-4 text-sm text-gray-600">No other users yet.</p>;

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
            {user.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
