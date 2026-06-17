import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CycleSelect from "@/components/CycleSelect";
import {
  PageTitle,
  Section,
  Stat,
  Th,
  Td,
  Tr,
  Score,
  StatusTag,
  Empty,
  LinkButton,
} from "@/components/ui";
import PaginatedTable from "@/components/PaginatedTable";
import {
  activeCycle,
  cyclesOf,
  getCycle,
  assessmentOf,
  userName,
  getKpi,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MyDashboard({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (!me.companyId) redirect("/login");

  const sp = await searchParams;
  const cycleList = cyclesOf(me.companyId);
  const cycle = (sp.cycle && getCycle(sp.cycle)) || activeCycle(me.companyId);
  if (!cycle) return <Empty>ยังไม่มีรอบประเมิน</Empty>;

  const a = assessmentOf(me.id, cycle.id);

  return (
    <div>
      <PageTitle
        right={
          <CycleSelect cycles={cycleList.map((c) => ({ id: c.id, name: c.name }))} value={cycle.id} />
        }
      >
        Dashboard ของฉัน
      </PageTitle>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="สถานะ" value={<span className="text-base"><StatusTag status={a?.status ?? "draft"} /></span>} />
        <Stat label="คะแนนประเมินตนเอง" value={<Score value={a?.selfTotal ?? null} />} />
        <Stat label="คะแนนสุดท้าย" value={<Score value={a?.finalScore ?? null} />} />
        <Stat label="หัวหน้าผู้ประเมิน" value={<span className="text-base">{userName(me.managerId)}</span>} />
      </div>

      <Section title="รายการ KPI ของฉัน">
        {!a || a.items.length === 0 ? (
          <Empty>
            <div className="space-y-3">
              <p>ยังไม่ได้ทำการประเมินตนเองในรอบนี้</p>
              <LinkButton href="/me/kpi">ไปทำ KPI ของฉัน</LinkButton>
            </div>
          </Empty>
        ) : (
          <PaginatedTable
            head={
              <>
                <Th>หัวข้อ KPI</Th>
                <Th>เชื่อมกับ</Th>
                <Th>Weight</Th>
                <Th>Time (กรอบเวลา)</Th>
                <Th className="text-right">ตนเอง</Th>
                <Th className="text-right">หัวหน้า</Th>
              </>
            }
            rows={a.items.map((it) => (
              <Tr key={it.id}>
                <Td className="font-medium">
                  {it.title || "—"}
                  {it.selfComment && (
                    <span className="mt-0.5 block text-xs font-normal text-neutral-400">Note: {it.selfComment}</span>
                  )}
                </Td>
                <Td className="text-neutral-500">{getKpi(it.linkedKpiId)?.title ?? "—"}</Td>
                <Td>{it.weight}%</Td>
                <Td className="text-neutral-500">{it.target || "—"}</Td>
                <Td className="text-right tabular-nums">{it.selfScore}</Td>
                <Td className="text-right">
                  <Score value={it.evalScore} />
                  {it.evalComment && (
                    <span className="mt-0.5 block text-xs font-normal text-neutral-400">{it.evalComment}</span>
                  )}
                </Td>
              </Tr>
            ))}
          />
        )}
      </Section>
    </div>
  );
}
