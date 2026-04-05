const styles: Record<string, string> = {
  GET: "bg-neon-green/10 text-neon-green border-neon-green/20",
  POST: "bg-neon-blue/10 text-neon-blue border-neon-blue/20",
  DELETE: "bg-neon-pink/10 text-neon-pink border-neon-pink/20",
  WS: "bg-neon-purple/10 text-neon-purple border-neon-purple/20",
};

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold tracking-wide ${styles[method] ?? styles.GET}`}
    >
      {method}
    </span>
  );
}
