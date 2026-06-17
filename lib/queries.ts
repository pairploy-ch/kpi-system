import { readDB } from "./store";
import type {
  Assessment,
  Company,
  Cycle,
  DB,
  Department,
  Division,
  Kpi,
  KpiLevel,
  User,
} from "./types";

export function db(): DB {
  return readDB();
}

/* ---------------- lookups ---------------- */
export function getCompany(id: string | null): Company | null {
  if (!id) return null;
  return db().companies.find((c) => c.id === id) ?? null;
}
export function getUser(id: string | null): User | null {
  if (!id) return null;
  return db().users.find((u) => u.id === id) ?? null;
}
export function userName(id: string | null): string {
  return getUser(id)?.name ?? "—";
}
export function getDivision(id: string | null): Division | null {
  if (!id) return null;
  return db().divisions.find((d) => d.id === id) ?? null;
}
export function getDepartment(id: string | null): Department | null {
  if (!id) return null;
  return db().departments.find((d) => d.id === id) ?? null;
}

/* ---------------- collections ---------------- */
export function companies(): Company[] {
  return db().companies;
}
export function divisionsOf(companyId: string): Division[] {
  return db().divisions.filter((d) => d.companyId === companyId);
}
export function departmentsOf(companyId: string): Department[] {
  return db().departments.filter((d) => d.companyId === companyId);
}
export function departmentsInDivision(divisionId: string): Department[] {
  return db().departments.filter((d) => d.divisionId === divisionId);
}
export function usersOf(companyId: string): User[] {
  return db().users.filter((u) => u.companyId === companyId);
}
export function usersInDepartment(deptId: string): User[] {
  return db().users.filter((u) => u.departmentId === deptId);
}
export function usersInDivision(divisionId: string): User[] {
  return db().users.filter((u) => u.divisionId === divisionId);
}
export function subordinatesOf(userId: string): User[] {
  return db().users.filter((u) => u.managerId === userId);
}

/* ---------------- cycles ---------------- */
export function cyclesOf(companyId: string): Cycle[] {
  return db()
    .cycles.filter((c) => c.companyId === companyId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function activeCycle(companyId: string): Cycle | null {
  const list = cyclesOf(companyId);
  return list.find((c) => c.active) ?? list[0] ?? null;
}
export function getCycle(id: string | null): Cycle | null {
  if (!id) return null;
  return db().cycles.find((c) => c.id === id) ?? null;
}

/* ---------------- KPIs ---------------- */
export function kpisOf(companyId: string, level?: KpiLevel): Kpi[] {
  return db().kpis.filter(
    (k) => k.companyId === companyId && (!level || k.level === level)
  );
}
export function divisionKpis(divisionId: string): Kpi[] {
  return db().kpis.filter((k) => k.level === "division" && k.divisionId === divisionId);
}
export function departmentKpis(deptId: string): Kpi[] {
  return db().kpis.filter((k) => k.level === "department" && k.departmentId === deptId);
}
export function getKpi(id: string | null): Kpi | null {
  if (!id) return null;
  return db().kpis.find((k) => k.id === id) ?? null;
}

/**
 * KPI ระดับบนที่ผู้ใช้สามารถ "เชื่อม" ได้ตอนประเมินตนเอง
 * - employee → KPI แผนกของตน
 * - dept_manager → KPI ฝ่ายของตน
 * - division_head → KPI องค์กร
 * - hr/ceo → KPI องค์กร
 */
export function linkableKpisFor(user: User): Kpi[] {
  if (!user.companyId) return [];
  switch (user.role) {
    case "employee":
      return user.departmentId ? departmentKpis(user.departmentId) : [];
    case "dept_manager":
      return user.divisionId ? divisionKpis(user.divisionId) : [];
    default:
      return kpisOf(user.companyId, "org");
  }
}

/* ---------------- assessments ---------------- */
export function assessmentOf(userId: string, cycleId: string): Assessment | null {
  return (
    db().assessments.find((a) => a.userId === userId && a.cycleId === cycleId) ?? null
  );
}
export function finalScoreOf(userId: string, cycleId: string): number | null {
  const a = assessmentOf(userId, cycleId);
  return a && a.status === "evaluated" ? a.finalScore : null;
}
/** รายการที่ลูกน้องส่งมาให้ผู้ใช้ประเมิน ในรอบที่กำหนด */
export function incomingAssessments(evaluatorId: string, cycleId: string): Assessment[] {
  const subs = subordinatesOf(evaluatorId).map((u) => u.id);
  return db().assessments.filter(
    (a) => a.cycleId === cycleId && subs.includes(a.userId)
  );
}

/* ---------------- scoring / aggregation ---------------- */
export function computeWeighted(
  items: { weight: number; score: number | null }[],
  field: "self" | "eval" = "eval"
): number | null {
  void field;
  const valid = items.filter((i) => i.score !== null);
  if (valid.length === 0) return null;
  const totalW = valid.reduce((s, i) => s + (i.weight || 0), 0);
  if (totalW <= 0) return null;
  const sum = valid.reduce((s, i) => s + (i.weight || 0) * (i.score as number), 0);
  return Math.round((sum / totalW) * 10) / 10;
}

export function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

/** คะแนนเฉลี่ยของกลุ่มผู้ใช้ในรอบหนึ่ง (เฉพาะที่ประเมินแล้ว) */
export function avgScoreOfUsers(userIds: string[], cycleId: string): number | null {
  const scores = userIds
    .map((id) => finalScoreOf(id, cycleId))
    .filter((s): s is number => s !== null);
  return avg(scores);
}

export function departmentAvg(deptId: string, cycleId: string): number | null {
  return avgScoreOfUsers(usersInDepartment(deptId).map((u) => u.id), cycleId);
}
export function divisionAvg(divisionId: string, cycleId: string): number | null {
  return avgScoreOfUsers(usersInDivision(divisionId).map((u) => u.id), cycleId);
}
export function companyAvg(companyId: string, cycleId: string): number | null {
  return avgScoreOfUsers(usersOf(companyId).map((u) => u.id), cycleId);
}

/* ---------------- bell curve ---------------- */
export interface Bucket {
  label: string;
  min: number;
  max: number;
  count: number;
}
/** จัดกลุ่มคะแนนเป็นช่วง ๆ สำหรับกราฟกระจายตัว */
export function bellCurve(scores: number[]): Bucket[] {
  const ranges: [number, number, string][] = [
    [0, 50, "0–49"],
    [50, 60, "50–59"],
    [60, 70, "60–69"],
    [70, 80, "70–79"],
    [80, 90, "80–89"],
    [90, 101, "90–100"],
  ];
  return ranges.map(([min, max, label]) => ({
    label,
    min,
    max,
    count: scores.filter((s) => s >= min && s < max).length,
  }));
}
