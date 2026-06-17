"use client";

import { useState, type ReactNode } from "react";
import { Table } from "@/components/ui";

const btnCls =
  "rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent";

/**
 * ตารางที่แบ่งหน้า ครั้งละ pageSize แถว (ค่าเริ่มต้น 10)
 * รับ rows เป็น array ของ <Tr> เพื่อให้ใช้แทน <Table> ได้ตรง ๆ
 * แสดงปุ่มแบ่งหน้าเฉพาะเมื่อมีรายการเกิน pageSize
 */
export default function PaginatedTable({
  head,
  rows,
  pageSize = 10,
}: {
  head: ReactNode;
  rows: ReactNode[];
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount - 1);
  const start = current * pageSize;
  const slice = rows.slice(start, start + pageSize);

  return (
    <div className="space-y-3">
      <Table head={head}>{slice}</Table>
      {total > pageSize && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span className="tabular-nums">
            แสดง {start + 1}–{start + slice.length} จาก {total} รายการ
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              className={btnCls}
            >
              ก่อนหน้า
            </button>
            <span className="px-2 tabular-nums">
              {current + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= pageCount - 1}
              className={btnCls}
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
