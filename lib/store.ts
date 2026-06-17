import fs from "node:fs";
import path from "node:path";
import type { DB } from "./types";
import { seedDB } from "./seed";

// เก็บข้อมูลทั้งหมดเป็นไฟล์ JSON ฝั่ง server (prototype)
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

function ensureFile(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedDB(), null, 2), "utf8");
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
