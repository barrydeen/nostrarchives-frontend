interface DocSectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function DocSection({ id, title, description, children }: DocSectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-white/40">{description}</p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function DocSubSection({
  id,
  title,
  description,
  children,
}: DocSectionProps) {
  return (
    <div id={id} className="scroll-mt-24">
      <h3 className="text-sm font-semibold text-white/70">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs text-white/30">{description}</p>
      )}
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}
