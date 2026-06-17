import { cookies } from "next/headers";

export type FlashType = "success" | "error";

/** ตั้งข้อความ toast (เรียกใน server action ก่อน return/redirect) */
export async function setFlash(message: string, type: FlashType = "success") {
  const jar = await cookies();
  jar.set("flash", `${type}|${encodeURIComponent(message)}`, {
    path: "/",
    maxAge: 30,
    httpOnly: false, // ให้ client เคลียร์เองได้
    sameSite: "lax",
  });
}

/** อ่านค่า flash cookie ดิบ (ส่งให้ client toaster) */
export async function readFlashRaw(): Promise<string | null> {
  const jar = await cookies();
  return jar.get("flash")?.value ?? null;
}
