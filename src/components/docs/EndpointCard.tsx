import type { RestEndpoint } from "@/lib/docs-data";
import { MethodBadge } from "./MethodBadge";
import { ParamTable } from "./ParamTable";
import { CodeBlock } from "./CodeBlock";

export function EndpointCard({ endpoint }: { endpoint: RestEndpoint }) {
  return (
    <div
      id={endpoint.id}
      className="scroll-mt-24 rounded-2xl border border-white/[0.06] bg-card/60 p-5 space-y-4"
    >
      {/* Method + Path */}
      <div className="flex items-center gap-2.5">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono text-white/80">{endpoint.path}</code>
      </div>

      {/* Description */}
      <p className="text-sm text-white/50">{endpoint.description}</p>

      {/* Notes */}
      {endpoint.notes?.map((note, i) => (
        <p key={i} className="text-xs text-neon-amber/60">
          {note}
        </p>
      ))}

      {/* Parameters */}
      {endpoint.params && endpoint.params.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
            Parameters
          </h4>
          <ParamTable params={endpoint.params} />
        </div>
      )}

      {/* Request Body */}
      {endpoint.requestBody && (
        <div>
          <h4 className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
            Request Body
          </h4>
          <p className="mb-2 text-xs text-white/40">{endpoint.requestBody.description}</p>
          <CodeBlock code={endpoint.requestBody.example} label="JSON" />
        </div>
      )}

      {/* Response Example */}
      <div>
        <h4 className="mb-2 text-[10px] uppercase tracking-widest text-white/30">
          Response
        </h4>
        <CodeBlock code={endpoint.responseExample} label="JSON" />
      </div>
    </div>
  );
}
