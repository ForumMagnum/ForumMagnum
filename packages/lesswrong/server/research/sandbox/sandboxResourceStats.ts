import type { Sandbox } from "@vercel/sandbox";
import { SANDBOX_DEFAULT_DIR } from "./listSandboxDirectory";

export interface SandboxResourceStats {
  /** CPU busy percentage over a short sample (0–100), or null if unavailable. */
  cpuPct: number | null;
  /** Memory used / total in bytes, or null if unavailable. */
  memUsed: number | null;
  memTotal: number | null;
  /** Workspace disk used / total in bytes, or null if unavailable. */
  diskUsed: number | null;
  diskTotal: number | null;
}

// One shell script emits a single JSON line. Memory prefers cgroup v2
// (container limit) and falls back to /proc/meminfo; CPU is host-busy% from two
// /proc/stat samples; disk is df on the workspace mount. Any unreadable metric
// comes back as null rather than failing the whole call.
const STATS_SCRIPT = `
set +e
mem_used=null; mem_total=null
if [ -r /sys/fs/cgroup/memory.current ] && [ -r /sys/fs/cgroup/memory.max ]; then
  mc=$(cat /sys/fs/cgroup/memory.current 2>/dev/null)
  mm=$(cat /sys/fs/cgroup/memory.max 2>/dev/null)
  case "$mc" in ''|*[!0-9]*) mc= ;; esac
  if [ -n "$mc" ]; then mem_used=$mc; fi
  case "$mm" in ''|*[!0-9]*) mm= ;; esac
  if [ -n "$mm" ]; then mem_total=$mm; fi
fi
if [ "$mem_total" = null ] || [ "$mem_used" = null ]; then
  mt=$(awk '/^MemTotal:/{print $2*1024}' /proc/meminfo 2>/dev/null)
  ma=$(awk '/^MemAvailable:/{print $2*1024}' /proc/meminfo 2>/dev/null)
  if [ -n "$mt" ]; then mem_total=$mt; fi
  if [ -n "$mt" ] && [ -n "$ma" ]; then mem_used=$((mt - ma)); fi
fi
disk_used=null; disk_total=null
df_line=$(df -B1 --output=size,used ${SANDBOX_DEFAULT_DIR} 2>/dev/null | tail -1)
dt=$(echo "$df_line" | awk '{print $1}')
du=$(echo "$df_line" | awk '{print $2}')
case "$dt" in ''|*[!0-9]*) ;; *) disk_total=$dt ;; esac
case "$du" in ''|*[!0-9]*) ;; *) disk_used=$du ;; esac
cpu=null
s1=$(head -1 /proc/stat 2>/dev/null)
sleep 0.2
s2=$(head -1 /proc/stat 2>/dev/null)
if [ -n "$s1" ] && [ -n "$s2" ]; then
  cpu=$(awk -v a="$s1" -v b="$s2" 'BEGIN{
    na=split(a,A," "); nb=split(b,B," ");
    t1=0; for(i=2;i<=na;i++) t1+=A[i];
    t2=0; for(i=2;i<=nb;i++) t2+=B[i];
    idle1=A[5]+A[6]; idle2=B[5]+B[6];
    dt=t2-t1; di=idle2-idle1;
    if(dt<=0){print "null"} else {p=(1-di/dt)*100; if(p<0)p=0; if(p>100)p=100; printf "%.1f", p}
  }')
fi
printf '{"cpuPct":%s,"memUsed":%s,"memTotal":%s,"diskUsed":%s,"diskTotal":%s}\\n' \
  "$cpu" "$mem_used" "$mem_total" "$disk_used" "$disk_total"
`;

/**
 * Read a running sandbox's current CPU / memory / disk utilization in one
 * command. Best-effort: any metric that can't be read comes back null.
 */
export async function getSandboxResourceStats(sandbox: Sandbox): Promise<SandboxResourceStats> {
  const result = await sandbox.runCommand({ cmd: "bash", args: ["-c", STATS_SCRIPT] });
  const nullStats: SandboxResourceStats = {
    cpuPct: null, memUsed: null, memTotal: null, diskUsed: null, diskTotal: null,
  };
  if (result.exitCode !== 0) return nullStats;
  const stdout = (await result.stdout()).trim();
  try {
    const parsed = JSON.parse(stdout) as Record<string, number | null>;
    const num = (v: number | null | undefined) => (typeof v === "number" && isFinite(v) ? v : null);
    return {
      cpuPct: num(parsed.cpuPct),
      memUsed: num(parsed.memUsed),
      memTotal: num(parsed.memTotal),
      diskUsed: num(parsed.diskUsed),
      diskTotal: num(parsed.diskTotal),
    };
  } catch {
    return nullStats;
  }
}
