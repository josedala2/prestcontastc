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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
    <div className="bg-card rounded-lg p-5 card-shadow border border-border animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className={cn(
            "text-2xl font-bold mt-1.5",
            variant === "primary" && "text-primary",
            variant === "success" && "text-success",
            variant === "warning" && "text-warning",
            variant === "destructive" && "text-destructive",
            variant === "default" && "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn(
            "p-2.5 rounded-lg",
            variant === "primary" && "bg-primary/10 text-primary",
            variant === "success" && "bg-success/10 text-success",
            variant === "warning" && "bg-warning/10 text-warning",
            variant === "destructive" && "bg-destructive/10 text-destructive",
            variant === "default" && "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
        )}
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
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      variant === "success" && "bg-success/10 text-success",
      variant === "warning" && "bg-warning/10 text-warning",
      variant === "info" && "bg-info/10 text-info",
      variant === "destructive" && "bg-destructive/10 text-destructive",
      variant === "default" && "bg-muted text-muted-foreground"
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        variant === "success" && "bg-success",
        variant === "warning" && "bg-warning",
        variant === "info" && "bg-info",
        variant === "destructive" && "bg-destructive",
        variant === "default" && "bg-muted-foreground"
      )} />
      {status}
    </span>
  );
}
