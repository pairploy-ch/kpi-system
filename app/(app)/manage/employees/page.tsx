import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { addEmployeeAction } from "@/lib/actions";
import { roleLabel, roleTone } from "@/lib/nav";
import { PageTitle, Section, Card, Field, Input, Select, Button } from "@/components/ui";
import EmployeeAdminTable, { type EmpRow } from "@/components/EmployeeAdminTable";
import { divisionsOf, departmentsOf, usersOf, getDivision, getDepartment, userName } from "@/lib/queries";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLES: { value: Role; label: string }[] = [
  { value: "employee", label: "พนักงาน" },
  { value: "dept_manager", label: "ผู้จัดการแผนก" },
  { value: "division_head", label: "ผู้บริหารฝ่าย" },
  { value: "ceo", label: "ผู้บริหารสูงสุด (CEO)" },
  { value: "hr", label: "ฝ่ายบุคคล (HR)" },
];

export default async function EmployeesPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "hr" || !me.companyId) redirect("/");

  const divisions = divisionsOf(me.companyId);
  const departments = departmentsOf(me.companyId);
  const users = usersOf(me.companyId);

  const rows: EmpRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    position: u.position,
    empId: u.empId,
    email: u.email,
    roleLabel: roleLabel(u.role),
    roleTone: roleTone(u.role),
    deptName: getDepartment(u.departmentId)?.name ?? getDivision(u.divisionId)?.name ?? "—",
    managerName: userName(u.managerId),
  }));

  return (
    <div className="max-w-4xl">
      <PageTitle>พนักงาน</PageTitle>

      <Section title="เพิ่มพนักงาน">
        <Card className="p-5">
          <form action={addEmployeeAction} className="grid gap-3 sm:grid-cols-2">
            <Field label="ชื่อ"><Input name="name" required /></Field>
            <Field label="รหัสพนักงาน (EmpID)"><Input name="emp_id" placeholder="เช่น EMP-005" /></Field>
            <Field label="อีเมล"><Input name="email" type="email" required /></Field>
            <Field label="เบอร์โทร"><Input name="phone" /></Field>
            <Field label="ตำแหน่ง"><Input name="position" placeholder="เช่น เจ้าหน้าที่บัญชี" /></Field>
            <Field label="บทบาท (Role)">
              <Select name="role" defaultValue="employee">
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Field>
            <Field label="ฝ่าย">
              <Select name="division_id" defaultValue="">
                <option value="">— ไม่ระบุ —</option>
                {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="แผนก">
              <Select name="department_id" defaultValue="">
                <option value="">— ไม่ระบุ —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {getDivision(d.divisionId)?.name} / {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="หัวหน้าผู้ประเมิน">
              <Select name="manager_id" defaultValue="">
                <option value="">— ไม่ระบุ —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.position})</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end sm:col-span-2">
              <Button>เพิ่มพนักงาน</Button>
            </div>
          </form>
        </Card>
      </Section>

      <Section title="พนักงานทั้งหมด">
        <EmployeeAdminTable rows={rows} />
      </Section>
    </div>
  );
}
