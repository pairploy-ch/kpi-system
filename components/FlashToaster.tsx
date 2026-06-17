"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * รับค่า flash cookie ดิบจาก server → เด้ง toast → เคลียร์ cookie ฝั่ง client
 * value เปลี่ยนทุกครั้งที่ server action ตั้งข้อความใหม่ (หลัง revalidate/refresh)
 */
export default function FlashToaster({ value }: { value: string | null }) {
  useEffect(() => {
    if (!value) return;
    const i = value.indexOf("|");
    const type = i >= 0 ? value.slice(0, i) : "success";
    const msg = decodeURIComponent(i >= 0 ? value.slice(i + 1) : value);
    if (type === "error") toast.error(msg);
    else toast.success(msg);
    document.cookie = "flash=; Max-Age=0; path=/";
  }, [value]);

  return null;
}
