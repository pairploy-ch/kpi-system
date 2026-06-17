import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { addDepartmentAction } from "@/lib/actions";
import { PageTitle, Section, Card, Field, Input, Select, Button, Th, Td, Tr, Empty } from "@/components/ui";
import PaginatedTable from "@/components/PaginatedTable";
import { divisionsOf, departmentsOf, getDivision, usersInDepartment } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "hr" || !me.companyId) redirect("/");

  const divisions = divisionsOf(me.companyId);
  const departments = departmentsOf(me.companyId);

  return (
    <div className="max-w-3xl">
      <PageTitle>แผนก</PageTitle>

      <Section title="เพิ่มแผนกใหม่">
        <Card className="p-5">
          {divisions.length === 0 ? (
            <p className="text-sm text-neutral-500">กรุณาเพิ่มฝ่ายก่อน</p>
          ) : (
            <form action={addDepartmentAction} className="flex items-end gap-3">
              <div className="w-56">
                <Field label="ฝ่าย">
                  <Select name="division_id" required>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex-1">
                <Field label="ชื่อแผนก">
                  <Input name="name" placeholder="เช่น แผนกการเงิน" required />
                </Field>
              </div>
              <Button>เพิ่มแผนก</Button>
            </form>
          )}
        </Card>
      </Section>

      <Section title="แผนกทั้งหมด">
        {departments.length === 0 ? (
          <Empty>ยังไม่มีแผนก</Empty>
        ) : (
          <PaginatedTable
            head={<><Th>แผนก</Th><Th>ฝ่าย</Th><Th>จำนวนพนักงาน</Th></>}
            rows={departments.map((d) => (
              <Tr key={d.id}>
                <Td className="font-medium">{d.name}</Td>
                <Td className="text-neutral-500">{getDivision(d.divisionId)?.name}</Td>
                <Td>{usersInDepartment(d.id).length}</Td>
              </Tr>
            ))}
          />
        )}
      </Section>
    </div>
  );
}
