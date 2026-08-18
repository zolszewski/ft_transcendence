

"use server";

import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL!;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("connect.sid");

  if (!sessionCookie) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthUser;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}
