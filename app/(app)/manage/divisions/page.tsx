import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { addDivisionAction } from "@/lib/actions";
import { PageTitle, Section, Card, Field, Input, Button, Th, Td, Tr, Empty } from "@/components/ui";
import PaginatedTable from "@/components/PaginatedTable";
import { divisionsOf, departmentsInDivision } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DivisionsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "hr" || !me.companyId) redirect("/");

  const divisions = divisionsOf(me.companyId);

  return (
    <div className="max-w-3xl">
      <PageTitle>ฝ่าย</PageTitle>

      <Section title="เพิ่มฝ่ายใหม่">
        <Card className="p-5">
          <form action={addDivisionAction} className="flex items-end gap-3">
            <div className="flex-1">
              <Field label="ชื่อฝ่าย">
                <Input name="name" placeholder="เช่น ฝ่ายบริหาร" required />
              </Field>
            </div>
            <Button>เพิ่มฝ่าย</Button>
          </form>
        </Card>
      </Section>

      <Section title="ฝ่ายทั้งหมด">
        {divisions.length === 0 ? (
          <Empty>ยังไม่มีฝ่าย</Empty>
        ) : (
          <PaginatedTable
            head={<><Th>ฝ่าย</Th><Th>จำนวนแผนก</Th></>}
            rows={divisions.map((d) => (
              <Tr key={d.id}>
                <Td className="font-medium">{d.name}</Td>
                <Td>{departmentsInDivision(d.id).length}</Td>
              </Tr>
            ))}
          />
        )}
      </Section>
    </div>
  );
}
