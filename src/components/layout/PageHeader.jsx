export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--em-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--em-ink)] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--em-muted)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
