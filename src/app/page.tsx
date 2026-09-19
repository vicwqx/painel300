import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { rotaPadraoDoPapel } from "@/lib/rotas";

export default async function RootPage() {
  const session = await auth();
  const papel = (session?.user as { role?: string } | undefined)?.role ?? "EXECUTIVO";
  redirect(rotaPadraoDoPapel(papel));
}
