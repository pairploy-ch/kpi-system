import type {
  DB,
  User,
  Company,
  Division,
  Department,
  Cycle,
  Kpi,
  Assessment,
  AssessmentItem,
} from "./types";

const T = "2026-01-10T00:00:00.000Z";

// helper สร้างรายการประเมินที่ "ประเมินแล้ว" สำหรับ seed (เพื่อให้ dashboard มีตัวเลข)
function evaluated(
  id: string,
  companyId: string,
  cycleId: string,
  userId: string,
  evaluatorId: string,
  linkedKpiId: string | null,
  finalScore: number
): Assessment {
  const items: AssessmentItem[] = [
    {
      id: id + "-i1",
      title: "เป้าหมายหลักตามบทบาท",
      weight: 60,
      target: "ภายในรอบประเมิน (ม.ค.–มิ.ย. 2568)",
      linkedKpiId,
      selfScore: Math.min(100, finalScore + 4),
      selfComment: "ทำงานเต็มที่ตามเป้าหมายที่วางไว้",
      evalScore: finalScore,
      evalComment: "ผลงานเป็นไปตามเป้าหมาย",
    },
    {
      id: id + "-i2",
      title: "การพัฒนาและความร่วมมือในทีม",
      weight: 40,
      target: "ต่อเนื่องตลอดรอบ",
      linkedKpiId,
      selfScore: Math.min(100, finalScore + 2),
      selfComment: "พัฒนาตนเองและช่วยงานทีมอย่างต่อเนื่อง",
      evalScore: finalScore,
      evalComment: "ทำได้ดี",
    },
  ];
  return {
    id,
    companyId,
    cycleId,
    userId,
    evaluatorId,
    items,
    status: "evaluated",
    selfTotal: finalScore + 3,
    finalScore,
    submittedAt: T,
    evaluatedAt: T,
    createdAt: T,
    updatedAt: T,
  };
}

/* ---------------- สเปกข้อมูลตัวอย่าง (อ่านง่าย แก้ง่าย) ---------------- */
interface EmpSpec {
  name: string;
  position: string;
  score: number;
}
interface DeptSpec {
  name: string;
  kpis: string[];
  manager: EmpSpec;
  employees: EmpSpec[];
}
interface DivSpec {
  name: string;
  kpis: string[];
  head: EmpSpec;
  departments: DeptSpec[];
}
interface CompanySpec {
  id: string;
  name: string;
  emailDomain: string;
  ceo: EmpSpec;
  hr: EmpSpec;
  orgKpis: string[];
  divisions: DivSpec[];
}

const COMPANIES: CompanySpec[] = [
  {
    id: "c1",
    name: "บริษัท สยามฟู้ดส์ อินดัสทรี จำกัด",
    emailDomain: "siamfoods.co.th",
    ceo: { name: "ธนกร วงศ์สถาพร", position: "ประธานเจ้าหน้าที่บริหาร (CEO)", score: 0 },
    hr: { name: "พิมพ์ชนก ศรีสุข", position: "ผู้จัดการฝ่ายทรัพยากรบุคคล", score: 0 },
    orgKpis: [
      "เพิ่มยอดขายรวมขององค์กร 20% ภายในปี 2568",
      "ยกระดับความพึงพอใจของลูกค้า ≥ 90%",
      "ลดของเสียในกระบวนการผลิต 15%",
    ],
    divisions: [
      {
        name: "ฝ่ายผลิต",
        head: { name: "สมชาย รุ่งเรืองกิจ", position: "ผู้อำนวยการฝ่ายผลิต", score: 91 },
        kpis: ["เพิ่มกำลังการผลิต 18%", "ลดต้นทุนการผลิตต่อหน่วย 12%"],
        departments: [
          {
            name: "แผนกผลิต",
            manager: { name: "วีรพงษ์ ชัยมงคล", position: "ผู้จัดการแผนกผลิต", score: 87 },
            kpis: ["ผลิตสินค้าได้ตามแผน 100%", "ลดเวลาหยุดเครื่องจักร 20%"],
            employees: [
              { name: "นพดล แสงทอง", position: "ช่างเทคนิคการผลิต", score: 85 },
              { name: "กิตติศักดิ์ บุญมา", position: "พนักงานควบคุมเครื่องจักร", score: 78 },
            ],
          },
          {
            name: "แผนกควบคุมคุณภาพ",
            manager: { name: "อรวรรณ พงษ์พานิช", position: "ผู้จัดการแผนกควบคุมคุณภาพ", score: 84 },
            kpis: ["สินค้าผ่านมาตรฐาน QC ≥ 99%"],
            employees: [
              { name: "สุภาพร ทองดี", position: "เจ้าหน้าที่ควบคุมคุณภาพ", score: 88 },
            ],
          },
        ],
      },
      {
        name: "ฝ่ายขายและการตลาด",
        head: { name: "จิราพร เลิศวัฒนา", position: "ผู้อำนวยการฝ่ายขายและการตลาด", score: 86 },
        kpis: ["ขยายฐานลูกค้าใหม่ 25%", "เพิ่มการรับรู้แบรนด์ในกลุ่มเป้าหมาย"],
        departments: [
          {
            name: "แผนกขาย",
            manager: { name: "ประเสริฐ มั่นคง", position: "ผู้จัดการแผนกขาย", score: 83 },
            kpis: ["ทำยอดขายได้ตามเป้า 100%"],
            employees: [
              { name: "ธีรเดช สุขสวัสดิ์", position: "พนักงานขาย", score: 92 },
              { name: "นภาพร ใจงาม", position: "พนักงานขาย", score: 73 },
            ],
          },
          {
            name: "แผนกการตลาด",
            manager: { name: "วรรณภา ศิริพงศ์", position: "ผู้จัดการแผนกการตลาด", score: 80 },
            kpis: ["จัดแคมเปญการตลาด 6 แคมเปญต่อปี"],
            employees: [
              { name: "พิชญา รัตนกุล", position: "เจ้าหน้าที่การตลาด", score: 82 },
            ],
          },
        ],
      },
      {
        name: "ฝ่ายบริหารและทรัพยากรบุคคล",
        head: { name: "มานพ อินทรีย์ทอง", position: "ผู้อำนวยการฝ่ายบริหาร", score: 79 },
        kpis: ["บริหารต้นทุนสำนักงานตามงบประมาณ"],
        departments: [
          {
            name: "แผนกบุคคล",
            manager: { name: "สุดารัตน์ คงเจริญ", position: "ผู้จัดการแผนกบุคคล", score: 81 },
            kpis: ["สรรหาพนักงานครบตามอัตรากำลัง 100%"],
            employees: [
              { name: "อนันต์ พูลสวัสดิ์", position: "เจ้าหน้าที่บุคคล", score: 80 },
            ],
          },
          {
            name: "แผนกบัญชีและการเงิน",
            manager: { name: "กนกพร วิไลรัตน์", position: "ผู้จัดการแผนกบัญชีและการเงิน", score: 77 },
            kpis: ["ปิดงบการเงินตรงเวลาทุกเดือน"],
            employees: [
              { name: "ปรีชา ธนวัฒน์", position: "เจ้าหน้าที่บัญชี", score: 76 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "c2",
    name: "บริษัท เอ็นเทค โซลูชันส์ จำกัด",
    emailDomain: "entech.co.th",
    ceo: { name: "วิชัย เจริญพานิช", position: "ประธานเจ้าหน้าที่บริหาร (CEO)", score: 0 },
    hr: { name: "รัตนาภรณ์ สมบูรณ์ทรัพย์", position: "ผู้จัดการฝ่ายทรัพยากรบุคคล", score: 0 },
    orgKpis: [
      "เพิ่มรายได้จากบริการคลาวด์ 30%",
      "รักษาอัตราคงอยู่ของลูกค้า ≥ 95%",
      "ส่งมอบโปรเจกต์ตรงเวลา ≥ 90%",
    ],
    divisions: [
      {
        name: "ฝ่ายพัฒนาผลิตภัณฑ์",
        head: { name: "อาทิตย์ ภักดีวงศ์", position: "ผู้อำนวยการฝ่ายพัฒนาผลิตภัณฑ์", score: 90 },
        kpis: ["ออกฟีเจอร์ใหม่ตาม roadmap", "ลดบั๊กบนระบบ production 40%"],
        departments: [
          {
            name: "แผนกวิศวกรรมซอฟต์แวร์",
            manager: { name: "ณัฐพล ศรีวิชัย", position: "ผู้จัดการแผนกวิศวกรรมซอฟต์แวร์", score: 88 },
            kpis: ["ส่งมอบงานตามแผน sprint ≥ 90%"],
            employees: [
              { name: "ภาณุพงศ์ ทรงศิริ", position: "วิศวกรซอฟต์แวร์", score: 89 },
              { name: "ศิริลักษณ์ ปัญญาดี", position: "วิศวกรซอฟต์แวร์", score: 84 },
            ],
          },
          {
            name: "แผนกออกแบบประสบการณ์ผู้ใช้",
            manager: { name: "ชนิกานต์ วัฒนกุล", position: "ผู้จัดการแผนกออกแบบ", score: 82 },
            kpis: ["ปรับปรุง UX จากผลตอบรับผู้ใช้"],
            employees: [
              { name: "ธัญญา รักษ์ศิลป์", position: "นักออกแบบ UX/UI", score: 81 },
            ],
          },
        ],
      },
      {
        name: "ฝ่ายปฏิบัติการ",
        head: { name: "เกรียงไกร พิทักษ์ชน", position: "ผู้อำนวยการฝ่ายปฏิบัติการ", score: 85 },
        kpis: ["รักษาเสถียรภาพระบบ uptime ≥ 99.9%"],
        departments: [
          {
            name: "แผนกบริการลูกค้า",
            manager: { name: "พรทิพย์ มณีรัตน์", position: "ผู้จัดการแผนกบริการลูกค้า", score: 79 },
            kpis: ["ตอบ ticket ภายใน SLA ≥ 95%"],
            employees: [
              { name: "วิภาวี จันทร์เพ็ญ", position: "เจ้าหน้าที่บริการลูกค้า", score: 77 },
              { name: "สมศักดิ์ ตั้งใจมั่น", position: "เจ้าหน้าที่บริการลูกค้า", score: 70 },
            ],
          },
          {
            name: "แผนกโครงสร้างพื้นฐาน",
            manager: { name: "ธนวัฒน์ กิจเจริญ", position: "ผู้จัดการแผนกโครงสร้างพื้นฐาน", score: 87 },
            kpis: ["ดูแลระบบคลาวด์ให้พร้อมใช้งาน"],
            employees: [
              { name: "ปิยะ ศักดิ์สิทธิ์", position: "วิศวกรระบบ", score: 86 },
            ],
          },
        ],
      },
      {
        name: "ฝ่ายบริหาร",
        head: { name: "สุนิสา อภิรักษ์กุล", position: "ผู้อำนวยการฝ่ายบริหาร", score: 80 },
        kpis: ["บริหารงบประมาณองค์กรอย่างมีประสิทธิภาพ"],
        departments: [
          {
            name: "แผนกบุคคลและธุรการ",
            manager: { name: "จารุวรรณ เพ็ชรงาม", position: "ผู้จัดการแผนกบุคคลและธุรการ", score: 82 },
            kpis: ["พัฒนาทักษะพนักงานครบ 100%"],
            employees: [
              { name: "กมลชนก ดวงแก้ว", position: "เจ้าหน้าที่บุคคล", score: 83 },
            ],
          },
          {
            name: "แผนกบัญชี",
            manager: { name: "วศิน ตระกูลทอง", position: "ผู้จัดการแผนกบัญชี", score: 78 },
            kpis: ["จัดทำรายงานการเงินถูกต้องตรงเวลา"],
            employees: [
              { name: "อภิญญา สุขเกษม", position: "เจ้าหน้าที่บัญชี", score: 79 },
            ],
          },
        ],
      },
    ],
  },
];

/** แปลงชื่อไทยเป็น local-part อีเมลแบบอ่านง่าย (ใช้ชื่อต้นแบบ romanize อย่างง่าย) */
function emailLocal(seq: number): string {
  return `staff${String(seq).padStart(3, "0")}`;
}

export function seedDB(): DB {
  const companies: Company[] = [];
  const divisions: Division[] = [];
  const departments: Department[] = [];
  const users: User[] = [];
  const cycles: Cycle[] = [];
  const kpis: Kpi[] = [];
  const assessments: Assessment[] = [];

  // เบอร์โทรแบบเรียงลำดับ (สมจริง: 0XX-XXX-XXXX)
  let phoneBase = 812000000;
  const nextPhone = (): string => {
    phoneBase += 137911;
    const full = "0" + String(phoneBase);
    return `${full.slice(0, 3)}-${full.slice(3, 6)}-${full.slice(6, 10)}`;
  };

  // ผู้ดูแลระบบ (เห็นทุกบริษัท)
  users.push({
    id: "u-admin",
    companyId: null,
    empId: "ADMIN",
    name: "ผู้ดูแลระบบ",
    email: "admin@kpi.system",
    phone: "-",
    role: "admin",
    divisionId: null,
    departmentId: null,
    position: "ผู้ดูแลระบบ",
    managerId: null,
    createdAt: T,
  });

  for (const spec of COMPANIES) {
    const cid = spec.id;
    companies.push({ id: cid, name: spec.name, createdAt: T });

    let emailSeq = 0;
    const email = () => `${emailLocal(++emailSeq)}@${spec.emailDomain}`;
    let kn = 0;
    const kid = () => `k-${cid}-${++kn}`;
    let exeSeq = 0;
    let mgrSeq = 0;
    let empSeq = 0;

    // รอบประเมิน: ปัจจุบัน (active) + รอบก่อนหน้า
    const cycleId = `cy-${cid}-1`;
    cycles.push({
      id: cycleId,
      companyId: cid,
      name: "รอบที่ 1/2568 (ม.ค.–มิ.ย.)",
      year: 2568,
      active: true,
      createdAt: T,
    });
    cycles.push({
      id: `cy-${cid}-0`,
      companyId: cid,
      name: "รอบที่ 2/2567 (ก.ค.–ธ.ค.)",
      year: 2567,
      active: false,
      createdAt: "2025-07-01T00:00:00.000Z",
    });

    // CEO
    const ceoId = `u-${cid}-ceo`;
    users.push({
      id: ceoId,
      companyId: cid,
      empId: "CEO-001",
      name: spec.ceo.name,
      email: `ceo@${spec.emailDomain}`,
      phone: nextPhone(),
      role: "ceo",
      divisionId: null,
      departmentId: null,
      position: spec.ceo.position,
      managerId: null,
      createdAt: T,
    });

    // HR
    const hrId = `u-${cid}-hr`;
    users.push({
      id: hrId,
      companyId: cid,
      empId: "HR-001",
      name: spec.hr.name,
      email: `hr@${spec.emailDomain}`,
      phone: nextPhone(),
      role: "hr",
      divisionId: null,
      departmentId: null,
      position: spec.hr.position,
      managerId: ceoId,
      createdAt: T,
    });

    // KPI องค์กร
    const orgKpiIds = spec.orgKpis.map((title) => {
      const id = kid();
      kpis.push({
        id,
        companyId: cid,
        level: "org",
        title,
        divisionId: null,
        departmentId: null,
        parentKpiId: null,
        createdById: hrId,
        createdAt: T,
      });
      return id;
    });

    spec.divisions.forEach((divSpec, di) => {
      const did = `d-${cid}-${di + 1}`;
      const headId = `u-${cid}-d${di + 1}-head`;
      users.push({
        id: headId,
        companyId: cid,
        empId: `EXE-${String(++exeSeq).padStart(3, "0")}`,
        name: divSpec.head.name,
        email: email(),
        phone: nextPhone(),
        role: "division_head",
        divisionId: did,
        departmentId: null,
        position: divSpec.head.position,
        managerId: ceoId,
        createdAt: T,
      });
      divisions.push({ id: did, companyId: cid, name: divSpec.name, headUserId: headId });

      // KPI ฝ่าย (เชื่อมกับ KPI องค์กรข้อแรก)
      const divKpiIds = divSpec.kpis.map((title) => {
        const id = kid();
        kpis.push({
          id,
          companyId: cid,
          level: "division",
          title,
          divisionId: did,
          departmentId: null,
          parentKpiId: orgKpiIds[0] ?? null,
          createdById: headId,
          createdAt: T,
        });
        return id;
      });

      // ผลประเมินของผู้บริหารฝ่าย (ประเมินโดย CEO)
      assessments.push(
        evaluated(`as-${headId}`, cid, cycleId, headId, ceoId, orgKpiIds[0] ?? null, divSpec.head.score)
      );

      divSpec.departments.forEach((depSpec, pi) => {
        const depid = `dep-${cid}-${di + 1}-${pi + 1}`;
        const mgrId = `u-${cid}-d${di + 1}p${pi + 1}-mgr`;
        users.push({
          id: mgrId,
          companyId: cid,
          empId: `MGR-${String(++mgrSeq).padStart(3, "0")}`,
          name: depSpec.manager.name,
          email: email(),
          phone: nextPhone(),
          role: "dept_manager",
          divisionId: did,
          departmentId: depid,
          position: depSpec.manager.position,
          managerId: headId,
          createdAt: T,
        });
        departments.push({ id: depid, companyId: cid, divisionId: did, name: depSpec.name, headUserId: mgrId });

        // KPI แผนก (เชื่อมกับ KPI ฝ่ายข้อแรก)
        const depKpiIds = depSpec.kpis.map((title) => {
          const id = kid();
          kpis.push({
            id,
            companyId: cid,
            level: "department",
            title,
            divisionId: did,
            departmentId: depid,
            parentKpiId: divKpiIds[0] ?? null,
            createdById: mgrId,
            createdAt: T,
          });
          return id;
        });

        // ผลประเมินของผู้จัดการแผนก (ประเมินโดยผู้บริหารฝ่าย)
        assessments.push(
          evaluated(`as-${mgrId}`, cid, cycleId, mgrId, headId, divKpiIds[0] ?? null, depSpec.manager.score)
        );

        depSpec.employees.forEach((emp) => {
          const eid = `u-${cid}-d${di + 1}p${pi + 1}-e${++empSeq}`;
          users.push({
            id: eid,
            companyId: cid,
            empId: `EMP-${String(empSeq).padStart(3, "0")}`,
            name: emp.name,
            email: email(),
            phone: nextPhone(),
            role: "employee",
            divisionId: did,
            departmentId: depid,
            position: emp.position,
            managerId: mgrId,
            createdAt: T,
          });
          // ผลประเมินของพนักงาน (ประเมินโดยผู้จัดการแผนก)
          assessments.push(
            evaluated(`as-${eid}`, cid, cycleId, eid, mgrId, depKpiIds[0] ?? null, emp.score)
          );
        });
      });
    });
  }

  return { companies, divisions, departments, users, cycles, kpis, assessments };
}
