"use client";

import { useMemo, useState } from "react";
import { Th, Td, Tr, Badge, Empty, type Tone } from "@/components/ui";
import PaginatedTable from "@/components/PaginatedTable";

export interface EmpRow {
  id: string;
  name: string;
  position: string;
  empId: string;
  email: string;
  roleLabel: string;
  roleTone: Tone;
  deptName: string;
  managerName: string;
}

const selectCls =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900";

export default function EmployeeAdminTable({
  rows,
  showManager = true,
}: {
  rows: EmpRow[];
  showManager?: boolean;
}) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [dept, setDept] = useState("");

  const roles = useMemo(() => [...new Set(rows.map((r) => r.roleLabel))], [rows]);
  const depts = useMemo(
    () => [...new Set(rows.map((r) => r.deptName).filter((d) => d && d !== "—"))],
    [rows]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (role && r.roleLabel !== role) return false;
      if (dept && r.deptName !== dept) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        r.empId.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.position.toLowerCase().includes(term)
      );
    });
  }, [rows, q, role, dept]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา ชื่อ / EmpID / อีเมล / ตำแหน่ง"
          className="flex-1 min-w-56 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
          <option value="">ทุกบทบาท</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {depts.length > 0 && (
          <select value={dept} onChange={(e) => setDept(e.target.value)} className={selectCls}>
            <option value="">ทุกแผนก</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty>ไม่พบพนักงานที่ตรงกับเงื่อนไข</Empty>
      ) : (
        <PaginatedTable
          key={`${q}|${role}|${dept}`}
          head={
            <>
              <Th>ชื่อ</Th>
              <Th>EmpID</Th>
              <Th>บทบาท</Th>
              <Th>แผนก</Th>
              {showManager && <Th>ผู้บังคับบัญชา</Th>}
            </>
          }
          rows={filtered.map((u) => (
            <Tr key={u.id}>
              <Td className="font-semibold">
                {u.name}
                <span className="block text-xs font-normal text-neutral-400">{u.position}</span>
              </Td>
              <Td className="text-neutral-500">{u.empId}</Td>
              <Td><Badge tone={u.roleTone}>{u.roleLabel}</Badge></Td>
              <Td className="text-neutral-500">{u.deptName}</Td>
              {showManager && <Td className="text-neutral-500">{u.managerName}</Td>}
            </Tr>
          ))}
        />
      )}

      <p className="text-xs text-neutral-400">แสดง {filtered.length} จาก {rows.length} คน</p>
    </div>
  );
}
