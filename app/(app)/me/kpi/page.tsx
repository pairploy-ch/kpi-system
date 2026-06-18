import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import CycleSelect from "@/components/CycleSelect";
import SelfAssessmentEditor from "@/components/SelfAssessmentEditor";
import { PageTitle, Section, StatusTag, Empty } from "@/components/ui";
import {
  activeCycle,
  cyclesOf,
  getCycle,
  assessmentOf,
  linkableKpisFor,
  userName,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MyKpiPage({
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
  const linkable = linkableKpisFor(me).map((k) => ({ id: k.id, title: k.title }));
  const linkLabel =
    me.role === "employee"
      ? "KPI แผนก"
      : me.role === "dept_manager"
        ? "KPI ฝ่าย"
        : "KPI องค์กร";

  const initial =
    a?.items.map((it) => ({
      id: it.id,
      title: it.title,
      weight: it.weight,
      target: it.target,
      linkedKpiId: it.linkedKpiId,
      selfScore: it.selfScore,
      selfComment: it.selfComment,
    })) ?? [];

  return (
    <div className="max-w-3xl">
      <PageTitle
        right={
          <CycleSelect cycles={cycleList.map((c) => ({ id: c.id, name: c.name }))} value={cycle.id} />
        }
      >
        KPI ของตนเอง
      </PageTitle>

      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
        <StatusTag status={a?.status ?? "draft"} />
        <span>
          ผู้บังคับบัญชาผู้ประเมิน: <span className="font-medium text-neutral-900">{userName(me.managerId)}</span>
        </span>
        {a?.status === "evaluated" && a.finalScore !== null && (
          <span>
            คะแนนสุดท้าย: <span className="font-semibold">{a.finalScore.toFixed(1)}</span>
          </span>
        )}
      </div>

      <Section>
        <SelfAssessmentEditor
          cycleId={cycle.id}
          initial={initial}
          initialRemark={a?.remark ?? ""}
          linkable={linkable}
          linkLabel={linkLabel}
          locked={a?.status === "evaluated"}
        />
      </Section>
    </div>
  );
}
