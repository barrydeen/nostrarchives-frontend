import type { WsEndpoint } from "@/lib/docs-data";
import { MethodBadge } from "./MethodBadge";
import { CodeBlock } from "./CodeBlock";
import { ArrowRight, ArrowLeft } from "lucide-react";

export function WsProtocolCard({ endpoint }: { endpoint: WsEndpoint }) {
  const displayUrl = endpoint.path
    ? `${endpoint.url}${endpoint.path}`
    : endpoint.url;

  return (
    <div
      id={endpoint.id}
      className="scroll-mt-24 rounded-2xl border border-white/[0.06] bg-card/60 p-5 space-y-4"
    >
      {/* URL */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <MethodBadge method="WS" />
        <code className="text-sm font-mono text-white/80 break-all">{displayUrl}</code>
      </div>

      {/* Description */}
      <p className="text-sm text-white/50">{endpoint.description}</p>

      {/* Protocol badge */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-white/30">Protocol</span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/50">
          {endpoint.protocol}
        </span>
        {endpoint.authRequired && (
          <span className="rounded-md bg-neon-pink/10 px-2 py-0.5 text-xs text-neon-pink">
            Auth Required
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-widest text-white/30">
          Messages
        </h4>
        {endpoint.messages.map((msg, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              {msg.direction === "send" ? (
                <ArrowRight className="h-3 w-3 text-neon-blue" />
              ) : (
                <ArrowLeft className="h-3 w-3 text-neon-green" />
              )}
              <span className={msg.direction === "send" ? "text-neon-blue" : "text-neon-green"}>
                {msg.direction === "send" ? "Client" : "Relay"}
              </span>
              <span className="text-white/40">{msg.label}</span>
            </div>
            <p className="pl-5 text-xs text-white/40">{msg.description}</p>
            <div className="pl-5">
              <CodeBlock code={msg.format} />
            </div>
          </div>
        ))}
      </div>

      {/* Constraints */}
      {endpoint.constraints && endpoint.constraints.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
            Constraints
          </h4>
          <ul className="space-y-1 text-xs text-white/40">
            {endpoint.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/20" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notes / Examples */}
      {endpoint.notes && endpoint.notes.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
            Examples
          </h4>
          <ul className="space-y-1 text-xs">
            {endpoint.notes.map((n, i) => (
              <li key={i} className="font-mono text-white/40">{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
