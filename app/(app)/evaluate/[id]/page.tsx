import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import EvaluationForm from "@/components/EvaluationForm";
import { PageTitle } from "@/components/ui";
import { db, getUser, getKpi, getCycle } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EvaluateDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const { id } = await params;

  const a = db().assessments.find((x) => x.id === id);
  if (!a) notFound();

  const owner = getUser(a.userId);
  // สิทธิ์: ต้องเป็นหัวหน้าของเจ้าของรายการ
  if (!owner || owner.managerId !== me.id) redirect("/evaluate");

  const cycle = getCycle(a.cycleId);
  const items = a.items.map((it) => ({
    id: it.id,
    title: it.title,
    weight: it.weight,
    target: it.target,
    linkedTitle: getKpi(it.linkedKpiId)?.title ?? "—",
    selfScore: it.selfScore,
    selfComment: it.selfComment,
    evalScore: it.evalScore,
    evalComment: it.evalComment,
  }));

  return (
    <div className="max-w-3xl">
      <Link href="/evaluate" className="mb-4 inline-block text-sm text-neutral-500 hover:text-neutral-900">
        ← กลับไปรายการประเมิน
      </Link>
      <PageTitle>ประเมิน: {owner.name}</PageTitle>
      <p className="mb-5 -mt-3 text-sm text-neutral-500">
        {owner.position} · {owner.empId} · รอบ {cycle?.name}
      </p>

      <EvaluationForm assessmentId={a.id} items={items} />
    </div>
  );
}
