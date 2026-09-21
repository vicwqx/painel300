import { NovoLeadSdrForm } from "./novo-lead-sdr-form";
import Link from "next/link";

export default function NovoLeadSdrPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <Link href="/dashboard/sdr" className="text-xs text-muted hover:underline">
        ← Voltar
      </Link>
      <NovoLeadSdrForm />
    </div>
  );
}
