import fs from "node:fs";
import path from "node:path";
import type { DB } from "./types";
import { seedDB } from "./seed";

// เก็บข้อมูลทั้งหมดเป็นไฟล์ JSON ฝั่ง server (prototype)
// ไฟล์ที่ deploy ไปด้วย (read-only บน serverless) ใช้เป็นค่าเริ่มต้น
const SEED_FILE = path.join(process.cwd(), "data", "store.json");

// บน Vercel/serverless filesystem เป็น read-only ยกเว้น /tmp
// เลยเขียนข้อมูลลง /tmp แทน (ephemeral — เหมาะกับ demo เท่านั้น)
const WRITABLE_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const DATA_FILE = path.join(WRITABLE_DIR, "store.json");

function ensureFile(): void {
  if (!fs.existsSync(WRITABLE_DIR)) fs.mkdirSync(WRITABLE_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    // seed จากไฟล์ที่ deploy มา ถ้ามี ไม่งั้นสร้างใหม่จาก seedDB()
    const initial =
      DATA_FILE !== SEED_FILE && fs.existsSync(SEED_FILE)
        ? fs.readFileSync(SEED_FILE, "utf8")
        : JSON.stringify(seedDB(), null, 2);
    fs.writeFileSync(DATA_FILE, initial, "utf8");
  }
}

export function readDB(): DB {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw) as DB;
}

export function writeDB(db: DB): void {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

/** อ่าน-แก้-เขียน แบบ atomic ใน process เดียว */
export function mutate<T>(fn: (db: DB) => T): T {
  const db = readDB();
  const result = fn(db);
  writeDB(db);
  return result;
}

let counter = 0;
/** สร้าง id อย่างง่าย (prototype) */
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
