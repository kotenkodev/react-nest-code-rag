import { Terminal } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-8 place-items-center border border-green text-(--text-primary)">
        <Terminal size={17} />
      </div>
      <span className="text-sm font-bold tracking-[0.2em] text-(--text-secondary)">
        CODE RAG
      </span>
    </div>
  );
}
