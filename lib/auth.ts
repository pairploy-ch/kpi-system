import { cookies } from "next/headers";
import { readDB } from "./store";
import type { User } from "./types";

const COOKIE = "uid";

/** ผู้ใช้ปัจจุบันจาก cookie (null ถ้ายังไม่ล็อกอิน) */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const uid = jar.get(COOKIE)?.value;
  if (!uid) return null;
  const db = readDB();
  return db.users.find((u) => u.id === uid) ?? null;
}

export async function setSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** หา user จากอีเมล (login passwordless) */
export function findUserByEmail(email: string): User | null {
  const db = readDB();
  const e = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === e) ?? null;
}
