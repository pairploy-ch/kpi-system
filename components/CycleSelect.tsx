"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function CycleSelect({
  cycles,
  value,
}: {
  cycles: { id: string; name: string }[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  return (
    <label className="text-right text-xs text-neutral-500">
      <span className="mb-1 block">รอบประเมิน</span>
      <select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(sp.toString());
          params.set("cycle", e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900"
      >
        {cycles.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
