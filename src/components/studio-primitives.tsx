import * as React from "react";

import { cn } from "@/lib/utils";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Panel({ className, ...props }: PanelProps) {
  return <section className={cn("clay", className)} {...props} />;
}

interface PanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  zh?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}

export function PanelHeader({
  title,
  zh,
  icon,
  right,
  className,
  ...props
}: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-2">
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
          {zh && <p className="text-xs text-muted-foreground">{zh}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  hint?: React.ReactNode;
}

export function SectionLabel({
  children,
  hint,
  className,
  ...props
}: SectionLabelProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {hint && <span className="normal-case tracking-normal">{hint}</span>}
    </div>
  );
}
