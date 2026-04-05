import type { Param } from "@/lib/docs-data";

export function ParamTable({ params }: { params: Param[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-widest text-white/30">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Required</th>
            <th className="pb-2 pr-4 font-medium">Default</th>
            <th className="pb-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-white/[0.03] last:border-0">
              <td className="py-2 pr-4 font-mono text-xs text-neon-blue">{p.name}</td>
              <td className="py-2 pr-4 text-white/40">{p.type}</td>
              <td className="py-2 pr-4">
                {p.required ? (
                  <span className="text-neon-pink">yes</span>
                ) : (
                  <span className="text-white/30">no</span>
                )}
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-white/40">
                {p.default ?? "\u2014"}
              </td>
              <td className="py-2 text-white/60">
                {p.description}
                {p.values && (
                  <span className="ml-1 text-white/30">
                    ({p.values.map((v, i) => (
                      <span key={v}>
                        {i > 0 && ", "}
                        <code className="text-neon-amber/70">{v}</code>
                      </span>
                    ))})
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
