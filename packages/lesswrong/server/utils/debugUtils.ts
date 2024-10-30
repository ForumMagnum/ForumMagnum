import { sleep } from "@/lib/utils/asyncUtils";
import { Globals } from "../vulcan-lib";

function busyWaitFor(ms: number) {
  const start = new Date().getTime();
  const end = start+ms;
  // eslint-disable-next-line no-empty
  while (new Date().getTime() < end) {}
}

async function busyWaitForever(yieldEveryMs=100) {
  // eslint-disable-next-line no-constant-condition
  while(true) {
    busyWaitFor(yieldEveryMs);
    console.log("Tick")
    await sleep(0);
  }
}

Globals.busyWaitForever = busyWaitForever

