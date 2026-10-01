import type { FriendRelationStatus } from "@/lib/types";

const STORAGE_KEY = "openscholar-friends-v1";
const PENDING_OUT_KEY = "openscholar-friend-pending-out-v1";

type FriendStore = {
  friendIds: string[];
};

function readStore(): FriendStore {
  if (typeof window === "undefined") {
    return { friendIds: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { friendIds: [] };
    const parsed = JSON.parse(raw) as FriendStore;
    return { friendIds: Array.isArray(parsed.friendIds) ? parsed.friendIds : [] };
  } catch {
    return { friendIds: [] };
  }
}

function writeStore(store: FriendStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function readPendingOut(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PENDING_OUT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingOut(ids: string[]) {
  localStorage.setItem(PENDING_OUT_KEY, JSON.stringify(ids));
}

function notifyFriendsChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("openscholar-friends-changed"));
  }
}

export function getFriendIds(): string[] {
  return readStore().friendIds;
}

export function getFriendCount(): number {
  return getFriendIds().length;
}

export function getRelationStatus(
  userId: string,
  currentUserId?: string,
): FriendRelationStatus {
  if (currentUserId && userId === currentUserId) return "none";
  const friends = getFriendIds();
  if (friends.includes(userId)) return "friends";
  const pendingOut = readPendingOut();
  if (pendingOut.includes(userId)) return "pending_outgoing";
  return "none";
}

export function addFriend(userId: string) {
  const store = readStore();
  if (!store.friendIds.includes(userId)) {
    store.friendIds.push(userId);
    writeStore(store);
  }
  writePendingOut(readPendingOut().filter((id) => id !== userId));
  notifyFriendsChange();
}

export function removeFriend(userId: string) {
  const store = readStore();
  store.friendIds = store.friendIds.filter((id) => id !== userId);
  writeStore(store);
  notifyFriendsChange();
}

export function subscribeFriendsChange(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === PENDING_OUT_KEY) {
      listener();
    }
  };
  const onLocal = () => listener();
  window.addEventListener("storage", onStorage);
  window.addEventListener("openscholar-friends-changed", onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("openscholar-friends-changed", onLocal);
  };
}
