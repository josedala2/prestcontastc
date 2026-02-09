import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
}

export function StatCard({ title, value, subtitle, icon, variant = "default" }: StatCardProps) {
  return (
    <div className="bg-card rounded border border-border card-shadow animate-fade-in overflow-hidden">
      <div className={cn(
        "h-1",
        variant === "primary" && "bg-primary",
        variant === "success" && "bg-success",
        variant === "warning" && "bg-accent",
        variant === "destructive" && "bg-secondary",
        variant === "default" && "bg-muted"
      )} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={cn(
              "text-xl font-bold mt-1",
              variant === "primary" && "text-primary",
              variant === "success" && "text-success",
              variant === "warning" && "text-accent",
              variant === "destructive" && "text-secondary",
              variant === "default" && "text-foreground"
            )}>
              {value}
            </p>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {icon && (
            <div className={cn(
              "p-2 rounded",
              variant === "primary" && "bg-primary/8 text-primary",
              variant === "success" && "bg-success/8 text-success",
              variant === "warning" && "bg-accent/10 text-accent",
              variant === "destructive" && "bg-secondary/8 text-secondary",
              variant === "default" && "bg-muted text-muted-foreground"
            )}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "info" | "destructive" | "default";
}

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold",
      variant === "success" && "bg-success/10 text-success",
      variant === "warning" && "bg-accent/10 text-accent-foreground",
      variant === "info" && "bg-info/10 text-info",
      variant === "destructive" && "bg-secondary/10 text-secondary",
      variant === "default" && "bg-muted text-muted-foreground"
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        variant === "success" && "bg-success",
        variant === "warning" && "bg-accent",
        variant === "info" && "bg-info",
        variant === "destructive" && "bg-secondary",
        variant === "default" && "bg-muted-foreground"
      )} />
      {status}
    </span>
  );
}
