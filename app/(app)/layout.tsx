import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { buildNav, roleLabel } from "@/lib/nav";
import { getCompany, getDepartment, getDivision } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const company = getCompany(me.companyId);
  const division = getDivision(me.divisionId);
  const department = getDepartment(me.departmentId);

  const crumbs = [
    company?.name,
    department?.name ?? division?.name,
    me.name,
    me.empId,
    me.position,
  ].filter(Boolean);

  const footerSub = [department?.name ?? division?.name, me.empId, me.position]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        companyName={company?.name ?? "ทุกบริษัท"}
        sections={buildNav(me)}
        footer={{ name: me.name, sub: footerSub || roleLabel(me.role) }}
        logout={logoutAction}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[var(--border)] px-8 py-6">
          <h1 className="text-2xl font-bold tracking-tight">สวัสดี, {me.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {crumbs.length ? crumbs.join("  ·  ") : roleLabel(me.role)}
          </p>
        </header>

        <main className="flex-1 px-8 py-7">{children}</main>
      </div>
    </div>
  );
}
