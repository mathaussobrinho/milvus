/** Linha unica: RAM, disco, CPU, GPU, antivirus (inventario). */
export function formatHardwareSummaryLine(d: {
  totalRamMb: number | null;
  totalDiskGb: number | null;
  cpuSummary: string | null;
  gpuSummary: string | null;
  antivirusSummary: string | null;
}): string {
  const ram =
    d.totalRamMb != null ? `${Math.round(d.totalRamMb / 1024)} GB RAM` : "—";
  const disk = d.totalDiskGb != null ? `${d.totalDiskGb} GB disco` : "—";
  const cpu = d.cpuSummary?.trim() || "—";
  const gpu = d.gpuSummary?.trim() || "—";
  const av = d.antivirusSummary?.trim() || "—";
  return `${ram} · ${disk} · ${cpu} · ${gpu} · ${av}`;
}
