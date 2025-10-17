import { testServerSetting } from "@/lib/instanceSettings";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.simpleApiRoute;

export async function POST() {
  if (!testServerSetting.get()) {
    return new Response("Not allowed", { status: 403 });
  }

  setTimeout(() => {
    process.kill(process.pid, 'SIGQUIT');
  }, 100);
  return new Response("Quitting server", { status: 202 });
}
