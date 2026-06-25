"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mutate, newId, nowISO } from "./store";
import { getCurrentUser, setSession, clearSession, findUserByEmail } from "./auth";
import { setFlash } from "./flash";
import type { Assessment, AssessmentItem, Role } from "./types";

async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function num(fd: FormData, k: string): number {
  const n = Number(fd.get(k));
  return Number.isFinite(n) ? n : 0;
}

/* ---------------- auth ---------------- */
export async function loginAction(formData: FormData) {
  const email = s(formData, "email");
  const user = findUserByEmail(email);
  if (!user) {
    await setFlash("ไม่พบอีเมลนี้ในระบบ", "error");
    redirect("/login?error=1");
  }
  await setSession(user.id);
  await setFlash(`ยินดีต้อนรับ ${user.name}`);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  await setFlash("ออกจากระบบแล้ว");
  redirect("/login");
}

/* ---------------- admin: companies + HR ---------------- */
export async function addCompanyAction(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/");
  const name = s(formData, "name");
  const hrEmail = s(formData, "hr_email");
  if (!name || !hrEmail) {
    await setFlash("กรอกชื่อบริษัทและอีเมล HR ให้ครบ", "error");
    return;
  }

  mutate((db) => {
    const companyId = newId("c");
    db.companies.push({ id: companyId, name, createdAt: nowISO() });
    db.users.push({
      id: newId("u"),
      companyId,
      empId: "HR-000",
      name: "HR",
      email: hrEmail,
      phone: "-",
      role: "hr",
      divisionId: null,
      departmentId: null,
      position: "เจ้าหน้าที่ฝ่ายบุคคล (HR)",
      managerId: null,
      createdAt: nowISO(),
    });
  });
  await setFlash(`เพิ่มบริษัท "${name}" แล้ว`);
  revalidatePath("/admin");
}

export async function addHRAction(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/");
  const companyId = s(formData, "company_id");
  const email = s(formData, "email");
  if (!companyId || !email) {
    await setFlash("กรอกอีเมล HR ให้ครบ", "error");
    return;
  }
  mutate((db) => {
    db.users.push({
      id: newId("u"),
      companyId,
      empId: "HR-" + String(db.users.filter((u) => u.companyId === companyId).length),
      name: "HR",
      email,
      phone: "-",
      role: "hr",
      divisionId: null,
      departmentId: null,
      position: "เจ้าหน้าที่ฝ่ายบุคคล (HR)",
      managerId: null,
      createdAt: nowISO(),
    });
  });
  await setFlash(`เพิ่มอีเมล HR (${email}) แล้ว`);
  revalidatePath(`/admin/company/${companyId}`);
}

/* ---------------- HR: structure ---------------- */
export async function addDivisionAction(formData: FormData) {
  const me = await requireUser();
  if (!me.companyId) return;
  const name = s(formData, "name");
  if (!name) {
    await setFlash("กรอกชื่อฝ่าย", "error");
    return;
  }
  mutate((db) => {
    db.divisions.push({
      id: newId("d"),
      companyId: me.companyId!,
      name,
      headUserId: null,
    });
  });
  await setFlash(`เพิ่มฝ่าย "${name}" แล้ว`);
  revalidatePath("/manage/divisions");
}

export async function addDepartmentAction(formData: FormData) {
  const me = await requireUser();
  if (!me.companyId) return;
  const divisionId = s(formData, "division_id");
  const name = s(formData, "name");
  if (!divisionId || !name) {
    await setFlash("เลือกฝ่ายและกรอกชื่อแผนก", "error");
    return;
  }
  mutate((db) => {
    db.departments.push({
      id: newId("dep"),
      companyId: me.companyId!,
      divisionId,
      name,
      headUserId: null,
    });
  });
  await setFlash(`เพิ่มแผนก "${name}" แล้ว`);
  revalidatePath("/manage/departments");
}

export async function deleteDivisionAction(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "hr" || !me.companyId) return;
  const id = s(formData, "id");
  if (!id) return;

  const result = mutate((db): { ok: boolean; reason?: string } => {
    const div = db.divisions.find((d) => d.id === id && d.companyId === me.companyId);
    if (!div) return { ok: false, reason: "ไม่พบฝ่าย" };
    if (db.departments.some((d) => d.divisionId === id)) {
      return { ok: false, reason: "ลบไม่ได้ ยังมีแผนกอยู่ในฝ่ายนี้" };
    }
    if (db.users.some((u) => u.divisionId === id)) {
      return { ok: false, reason: "ลบไม่ได้ ยังมีพนักงานอยู่ในฝ่ายนี้" };
    }
    db.divisions = db.divisions.filter((d) => d.id !== id);
    return { ok: true };
  });

  await setFlash(result.ok ? "ลบฝ่ายแล้ว" : result.reason ?? "ลบไม่ได้", result.ok ? "success" : "error");
  revalidatePath("/manage/divisions");
}

export async function deleteDepartmentAction(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "hr" || !me.companyId) return;
  const id = s(formData, "id");
  if (!id) return;

  const result = mutate((db): { ok: boolean; reason?: string } => {
    const dep = db.departments.find((d) => d.id === id && d.companyId === me.companyId);
    if (!dep) return { ok: false, reason: "ไม่พบแผนก" };
    if (db.users.some((u) => u.departmentId === id)) {
      return { ok: false, reason: "ลบไม่ได้ ยังมีพนักงานอยู่ในแผนกนี้" };
    }
    db.departments = db.departments.filter((d) => d.id !== id);
    return { ok: true };
  });

  await setFlash(result.ok ? "ลบแผนกแล้ว" : result.reason ?? "ลบไม่ได้", result.ok ? "success" : "error");
  revalidatePath("/manage/departments");
}

export async function addEmployeeAction(formData: FormData) {
  const me = await requireUser();
  if (!me.companyId) return;
  const name = s(formData, "name");
  const email = s(formData, "email");
  const phone = s(formData, "phone");
  const empId = s(formData, "emp_id");
  const role = (s(formData, "role") || "employee") as Role;
  const divisionId = s(formData, "division_id") || null;
  const departmentId = s(formData, "department_id") || null;
  const position = s(formData, "position");
  const managerId = s(formData, "manager_id") || null;
  if (!name || !email) {
    await setFlash("กรอกชื่อและอีเมลพนักงานให้ครบ", "error");
    return;
  }

  mutate((db) => {
    const id = newId("u");
    db.users.push({
      id,
      companyId: me.companyId!,
      empId: empId || id.toUpperCase(),
      name,
      email,
      phone: phone || "-",
      role,
      divisionId,
      departmentId,
      position: position || "พนักงาน",
      managerId,
      createdAt: nowISO(),
    });
    // ตั้งเป็นหัวหน้าหน่วยงานอัตโนมัติตาม role
    if (role === "dept_manager" && departmentId) {
      const dep = db.departments.find((d) => d.id === departmentId);
      if (dep && !dep.headUserId) dep.headUserId = id;
    }
    if (role === "division_head" && divisionId) {
      const div = db.divisions.find((d) => d.id === divisionId);
      if (div && !div.headUserId) div.headUserId = id;
    }
  });
  await setFlash(`เพิ่มพนักงาน "${name}" แล้ว`);
  revalidatePath("/manage/employees");
}

export async function addCycleAction(formData: FormData) {
  const me = await requireUser();
  if (!me.companyId) return;
  const name = s(formData, "name");
  const year = num(formData, "year") || new Date().getFullYear() + 543;
  const active = formData.get("active") === "on";
  if (!name) {
    await setFlash("กรอกชื่อรอบประเมิน", "error");
    return;
  }
  mutate((db) => {
    if (active) {
      db.cycles.forEach((c) => {
        if (c.companyId === me.companyId) c.active = false;
      });
    }
    db.cycles.push({
      id: newId("cy"),
      companyId: me.companyId!,
      name,
      year,
      active,
      createdAt: nowISO(),
    });
  });
  await setFlash(`สร้างรอบประเมิน "${name}" แล้ว`);
  revalidatePath("/manage/cycles");
}

/* ---------------- KPI definitions ---------------- */
export async function addOrgKpiAction(formData: FormData) {
  const me = await requireUser();
  if (me.role !== "hr" || !me.companyId) return;
  const title = s(formData, "title");
  if (!title) {
    await setFlash("กรอกหัวข้อ KPI", "error");
    return;
  }
  mutate((db) => {
    db.kpis.push({
      id: newId("k"),
      companyId: me.companyId!,
      level: "org",
      title,
      divisionId: null,
      departmentId: null,
      parentKpiId: null,
      createdById: me.id,
      createdAt: nowISO(),
    });
  });
  await setFlash("เพิ่ม KPI องค์กรแล้ว");
  revalidatePath("/manage/org-kpi");
}

/** เพิ่ม KPI ฝ่าย/แผนก ตามขอบเขตของผู้ใช้ปัจจุบัน */
export async function addUnitKpiAction(formData: FormData) {
  const me = await requireUser();
  if (!me.companyId) return;
  const title = s(formData, "title");
  const parentKpiId = s(formData, "parent_kpi_id") || null;
  if (!title) {
    await setFlash("กรอกหัวข้อ KPI", "error");
    return;
  }

  mutate((db) => {
    if (me.role === "division_head" && me.divisionId) {
      db.kpis.push({
        id: newId("k"),
        companyId: me.companyId!,
        level: "division",
        title,
        divisionId: me.divisionId,
        departmentId: null,
        parentKpiId,
        createdById: me.id,
        createdAt: nowISO(),
      });
    } else if (me.role === "dept_manager" && me.departmentId) {
      db.kpis.push({
        id: newId("k"),
        companyId: me.companyId!,
        level: "department",
        title,
        divisionId: me.divisionId,
        departmentId: me.departmentId,
        parentKpiId,
        createdById: me.id,
        createdAt: nowISO(),
      });
    }
  });
  await setFlash("เพิ่ม KPI แล้ว");
  revalidatePath("/manage/unit-kpi");
}

/* ---------------- self assessment ---------------- */
function weighted(items: { weight: number; score: number | null }[]): number | null {
  const valid = items.filter((i) => i.score !== null);
  if (!valid.length) return null;
  const w = valid.reduce((s2, i) => s2 + (i.weight || 0), 0);
  if (w <= 0) return null;
  const sum = valid.reduce((s2, i) => s2 + (i.weight || 0) * (i.score as number), 0);
  return Math.round((sum / w) * 10) / 10;
}

function parseItems(raw: string): AssessmentItem[] {
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((x: Record<string, unknown>, i): AssessmentItem => ({
    id: typeof x.id === "string" ? x.id : `it-${i}`,
    title: String(x.title ?? "").trim(),
    weight: Number(x.weight) || 0,
    target: String(x.target ?? "").trim(),
    linkedKpiId: x.linkedKpiId ? String(x.linkedKpiId) : null,
    selfScore: Number(x.selfScore) || 0,
    selfComment: String(x.selfComment ?? "").trim(),
    evalScore: null,
    evalComment: "",
  }));
}

/** บันทึก/ส่ง การประเมินตนเองของผู้ใช้ปัจจุบันในรอบที่กำหนด */
export async function saveSelfAssessmentAction(formData: FormData) {
  const me = await requireUser();
  if (!me.companyId) return;
  const cycleId = s(formData, "cycle_id");
  const submit = s(formData, "intent") === "submit";
  const items = parseItems(s(formData, "items"));
  const remark = s(formData, "remark").trim();
  if (!cycleId) return;
  if (submit && items.length === 0) {
    await setFlash("เพิ่ม KPI อย่างน้อย 1 ข้อก่อนส่ง", "error");
    return;
  }
  if (submit) {
    const totalWeight = items.reduce((sum, i) => sum + (Number(i.weight) || 0), 0);
    if (totalWeight !== 100) {
      await setFlash(`น้ำหนักรวมต้องเท่ากับ 100% ก่อนส่ง (ตอนนี้ ${totalWeight}%)`, "error");
      return;
    }
  }

  mutate((db) => {
    let a = db.assessments.find((x) => x.userId === me.id && x.cycleId === cycleId);
    const selfTotal = weighted(items.map((i) => ({ weight: i.weight, score: i.selfScore })));
    if (!a) {
      a = {
        id: newId("as"),
        companyId: me.companyId!,
        cycleId,
        userId: me.id,
        evaluatorId: me.managerId,
        items,
        remark,
        status: submit ? "submitted" : "draft",
        selfTotal,
        finalScore: null,
        submittedAt: submit ? nowISO() : null,
        evaluatedAt: null,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      db.assessments.push(a);
    } else {
      // เก็บคะแนนหัวหน้าเดิมไว้ถ้ามีการประเมินแล้ว
      const prevEval = new Map(a.items.map((it) => [it.id, it]));
      a.items = items.map((it) => {
        const p = prevEval.get(it.id);
        return p ? { ...it, evalScore: p.evalScore, evalComment: p.evalComment } : it;
      });
      a.evaluatorId = me.managerId;
      a.selfTotal = selfTotal;
      a.remark = remark;
      a.updatedAt = nowISO();
      if (submit) {
        a.status = "submitted";
        a.submittedAt = nowISO();
      }
    }
  });
  await setFlash(submit ? "ส่งให้ผู้บังคับบัญชาประเมินแล้ว" : "บันทึกร่างแล้ว");
  revalidatePath("/me/kpi");
  revalidatePath("/me");
}

/** หัวหน้าบันทึกการประเมินลูกน้อง */
export async function saveEvaluationAction(formData: FormData) {
  const me = await requireUser();
  const assessmentId = s(formData, "assessment_id");
  if (!assessmentId) return;

  let scores: Record<string, { score: number; comment: string }> = {};
  try {
    scores = JSON.parse(s(formData, "scores"));
  } catch {
    scores = {};
  }

  const result = mutate((db): { ok: boolean; name?: string; score?: number | null } => {
    const a = db.assessments.find((x) => x.id === assessmentId);
    if (!a) return { ok: false };
    // ตรวจสิทธิ์: ต้องเป็นหัวหน้าของเจ้าของรายการ
    const owner = db.users.find((u) => u.id === a.userId);
    if (!owner || owner.managerId !== me.id) return { ok: false };

    a.items = a.items.map((it) => {
      const v = scores[it.id];
      return v
        ? { ...it, evalScore: Number(v.score) || 0, evalComment: v.comment ?? "" }
        : it;
    });
    a.finalScore = weighted(a.items.map((i) => ({ weight: i.weight, score: i.evalScore })));
    a.status = "evaluated";
    a.evaluatedAt = nowISO();
    a.evaluatorId = me.id;
    return { ok: true, name: owner.name, score: a.finalScore };
  });

  if (result.ok) {
    await setFlash(
      `บันทึกผลประเมิน ${result.name ?? ""} แล้ว (คะแนน ${result.score ?? "-"})`
    );
  } else {
    await setFlash("ไม่สามารถบันทึกผลประเมินได้", "error");
  }
  revalidatePath("/evaluate");
  revalidatePath(`/evaluate/${assessmentId}`);
  revalidatePath("/dashboard");
}
