"use client"; 


import { useActionState } from "react";
import {useFormStatus} from "react-dom";
import { getCurrentUser} from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";


export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <form className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-3xl font-bold">
          Login
        </h1>

        <div className="flex flex-col gap-2">
          <label htmlFor="email">
            Email
          </label>

          <input
            type="email"
            id="email"
            name="email"
            required
            className="border p-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password">
            Password
          </label>

          <input
            type="password"
            id="password"
            name="password"
            required
            className="border p-2"
          />
        </div>

        <button
          type="submit"
          className="border p-2"
        >
          Login
        </button>
      </form>
    </main>
  );
}
