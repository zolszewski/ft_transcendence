import { apiClient } from "@/lib/apiClient";
import type { FriendRelationStatus } from "@/lib/types";

export function notifyFriendsChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("openscholar-friends-changed"));
  }
}

export function subscribeFriendsChange(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const onLocal = () => listener();
  window.addEventListener("openscholar-friends-changed", onLocal);
  return () => window.removeEventListener("openscholar-friends-changed", onLocal);
}

export async function fetchRelationStatus(
  userId: string,
): Promise<FriendRelationStatus> {
  const response = await apiClient.friends.getStatus(userId);
  return response.success ? response.data : "none";
}

export async function sendFriendRequest(userId: string) {
  const response = await apiClient.friends.request(userId);
  if (response.success) notifyFriendsChange();
  return response;
}

export async function acceptFriendRequest(userId: string) {
  const response = await apiClient.friends.accept(userId);
  if (response.success) notifyFriendsChange();
  return response;
}

export async function removeFriendship(userId: string) {
  const response = await apiClient.friends.remove(userId);
  if (response.success) notifyFriendsChange();
  return response;
}
