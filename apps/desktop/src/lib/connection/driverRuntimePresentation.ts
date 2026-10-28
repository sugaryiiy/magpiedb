import type { DriverRuntimeHealth, DriverRuntimeStatus } from "@/lib/backend/api";

export function formatRuntimeBytes(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatRuntimeCpu(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${Math.max(0, value).toFixed(1)}%`;
}

export function formatRuntimeUptime(seconds: number | null | undefined): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
}

export function runtimeStatusClass(status: DriverRuntimeStatus): string {
  switch (status) {
    case "running":
      return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400";
    case "error":
      return "bg-destructive/10 text-destructive";
    case "unknown":
      return "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function runtimeStatusDotClass(status: DriverRuntimeStatus): string {
  switch (status) {
    case "running":
      return "bg-zinc-500";
    case "error":
      return "bg-destructive";
    case "unknown":
      return "bg-zinc-500";
    default:
      return "bg-muted-foreground/40";
  }
}

export function runtimeHealthClass(health: DriverRuntimeHealth): string {
  switch (health) {
    case "error":
      return "text-destructive";
    case "warning":
      return "text-zinc-700 dark:text-zinc-400";
    default:
      return "text-zinc-700 dark:text-zinc-400";
  }
}
