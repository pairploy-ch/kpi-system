import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CycleSelect from "@/components/CycleSelect";
import MemberScoreTable, { type MemberRow } from "@/components/MemberScoreTable";
import {
  PageTitle,
  Section,
  Stat,
  Th,
  Td,
  Tr,
  Score,
  Empty,
  BarChart,
  Card,
} from "@/components/ui";
import PaginatedTable from "@/components/PaginatedTable";
import {
  activeCycle,
  cyclesOf,
  getCycle,
  divisionsOf,
  departmentsOf,
  departmentsInDivision,
  usersOf,
  usersInDepartment,
  usersInDivision,
  getDivision,
  getDepartment,
  getUser,
  finalScoreOf,
  departmentAvg,
  divisionAvg,
  companyAvg,
  kpisOf,
  bellCurve,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role === "employee") redirect("/me");
  if (me.role === "admin") redirect("/admin");
  if (!me.companyId) redirect("/login");

  const sp = await searchParams;
  const cycleList = cyclesOf(me.companyId);
  const cycle = (sp.cycle && getCycle(sp.cycle)) || activeCycle(me.companyId);
  if (!cycle) {
    return <Empty>ยังไม่มีรอบประเมิน</Empty>;
  }

  const selector = (
    <CycleSelect cycles={cycleList.map((c) => ({ id: c.id, name: c.name }))} value={cycle.id} />
  );

  /* ---------- ผจก.แผนก: พนักงานในแผนก ---------- */
  if (me.role === "dept_manager" && me.departmentId) {
    const dept = getDepartment(me.departmentId);
    const members = usersInDepartment(me.departmentId);
    const avg = departmentAvg(me.departmentId, cycle.id);
    return (
      <div>
        <PageTitle right={selector}>Dashboard แผนก</PageTitle>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="แผนก" value={<span className="text-base">{dept?.name}</span>} />
          <Stat label="จำนวนพนักงาน" value={members.length} />
          <Stat label="คะแนนเฉลี่ยแผนก" value={<Score value={avg} />} />
        </div>
        <Section title="พนักงานในแผนก">
          <MembersTable userIds={members.map((m) => m.id)} cycleId={cycle.id} />
        </Section>
      </div>
    );
  }

  /* ---------- ผู้บริหารฝ่าย: AVG ฝ่าย + ทุกแผนก ---------- */
  if (me.role === "division_head" && me.divisionId) {
    const div = getDivision(me.divisionId);
    const depts = departmentsInDivision(me.divisionId);
    const members = usersInDivision(me.divisionId);
    const avg = divisionAvg(me.divisionId, cycle.id);
    const scores = members
      .map((m) => finalScoreOf(m.id, cycle.id))
      .filter((x): x is number => x !== null);
    return (
      <div>
        <PageTitle right={selector}>Dashboard ฝ่าย</PageTitle>
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="ฝ่าย" value={<span className="text-base">{div?.name}</span>} />
          <Stat label="จำนวนแผนก" value={depts.length} />
          <Stat label="จำนวนพนักงาน" value={members.length} />
          <Stat label="คะแนนเฉลี่ยฝ่าย" value={<Score value={avg} />} />
        </div>

        <Section title="คะแนนเฉลี่ยรายแผนก">
          <PaginatedTable
            head={<><Th>แผนก</Th><Th>จำนวนพนักงาน</Th><Th>AVG</Th></>}
            rows={depts.map((d) => (
              <Tr key={d.id}>
                <Td className="font-medium">{d.name}</Td>
                <Td>{usersInDepartment(d.id).length}</Td>
                <Td><Score value={departmentAvg(d.id, cycle.id)} /></Td>
              </Tr>
            ))}
          />
        </Section>

        <Section title="Bell Curve · กระจายตัวคะแนน">
          <Card className="px-6 py-6">
            <BarChart data={bellCurve(scores)} />
          </Card>
        </Section>

        <Section title="รายบุคคล">
          <MembersTable userIds={members.map((m) => m.id)} cycleId={cycle.id} />
        </Section>
      </div>
    );
  }

  /* ---------- HR / CEO: ภาพรวมองค์กร ---------- */
  const divisions = divisionsOf(me.companyId);
  const departments = departmentsOf(me.companyId);
  const allUsers = usersOf(me.companyId).filter((u) => u.role !== "hr" || u.id === me.id);
  const everyone = usersOf(me.companyId);
  const avg = companyAvg(me.companyId, cycle.id);
  const orgKpis = kpisOf(me.companyId, "org");
  const scores = everyone
    .map((m) => finalScoreOf(m.id, cycle.id))
    .filter((x): x is number => x !== null);

  return (
    <div>
      <PageTitle right={selector}>Dashboard องค์กร</PageTitle>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="จำนวนพนักงาน" value={everyone.length} />
        <Stat label="จำนวนฝ่าย" value={divisions.length} />
        <Stat label="จำนวนแผนก" value={departments.length} />
        <Stat label="คะแนนเฉลี่ยองค์กร" value={<Score value={avg} />} />
      </div>

      <Section title="KPI องค์กร">
        {orgKpis.length === 0 ? (
          <Empty>ยังไม่มี KPI องค์กร</Empty>
        ) : (
          <Card className="divide-y divide-[var(--border)]">
            {orgKpis.map((k) => (
              <div key={k.id} className="px-5 py-3 text-sm">
                {k.title}
              </div>
            ))}
          </Card>
        )}
      </Section>

      <Section title="คะแนนเฉลี่ยรายฝ่าย">
        <PaginatedTable
          head={<><Th>ฝ่าย</Th><Th>จำนวนแผนก</Th><Th>จำนวนพนักงาน</Th><Th>AVG</Th></>}
          rows={divisions.map((d) => (
            <Tr key={d.id}>
              <Td className="font-medium">{d.name}</Td>
              <Td>{departmentsInDivision(d.id).length}</Td>
              <Td>{usersInDivision(d.id).length}</Td>
              <Td><Score value={divisionAvg(d.id, cycle.id)} /></Td>
            </Tr>
          ))}
        />
      </Section>

      <Section title="คะแนนเฉลี่ยรายแผนก">
        <PaginatedTable
          head={<><Th>แผนก</Th><Th>ฝ่าย</Th><Th>จำนวน</Th><Th>AVG</Th></>}
          rows={departments.map((d) => (
            <Tr key={d.id}>
              <Td className="font-medium">{d.name}</Td>
              <Td className="text-neutral-500">{getDivision(d.divisionId)?.name}</Td>
              <Td>{usersInDepartment(d.id).length}</Td>
              <Td><Score value={departmentAvg(d.id, cycle.id)} /></Td>
            </Tr>
          ))}
        />
      </Section>

      <Section title="Bell Curve · กระจายตัวคะแนน">
        <Card className="px-6 py-6">
          <BarChart data={bellCurve(scores)} />
        </Card>
      </Section>

      <Section title="คะแนนรายบุคคล">
        <MembersTable userIds={allUsers.map((m) => m.id)} cycleId={cycle.id} showDept />
      </Section>
    </div>
  );
}

/* ตารางสมาชิก + Final Score (ค้นหา/กรองได้) */
function MembersTable({
  userIds,
  cycleId,
  showDept = false,
}: {
  userIds: string[];
  cycleId: string;
  showDept?: boolean;
}) {
  if (userIds.length === 0) return <Empty>ไม่มีพนักงาน</Empty>;
  const rows: MemberRow[] = userIds
    .map((id) => getUser(id))
    .filter((u): u is NonNullable<typeof u> => !!u)
    .map((u) => ({
      id: u.id,
      name: u.name,
      empId: u.empId,
      position: u.position,
      deptName: getDepartment(u.departmentId)?.name ?? "—",
      finalScore: finalScoreOf(u.id, cycleId),
    }));
  return <MemberScoreTable rows={rows} showDept={showDept} />;
}
