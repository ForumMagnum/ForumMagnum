import { faviconUrlSetting } from "@/lib/instanceSettings";
import { redirect } from "next/navigation";

export function GET() {
  return redirect(faviconUrlSetting.get());
}
