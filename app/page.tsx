import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { landingPath } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function Home() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  redirect(landingPath(me));
}
