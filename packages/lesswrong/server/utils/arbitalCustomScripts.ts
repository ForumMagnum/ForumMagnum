import { isLWorAF } from "@/lib/instanceSettings";
import { cheerioParse } from "./htmlUtil";

const arbitalScripts: Record<string, string> = {

};

function applyArbitalPathReplacements(html: string) {
  const $ = cheerioParse(html);

  $('[class^="arb-custom-script-"]').each((idx, el) => {
    const scriptId = $(el).attr('class')?.split('-')[3];
    if (!scriptId) {
      return;
    }

    const script: string = arbitalScripts[scriptId];
    if (!script) {
      console.error(`No script found for id ${scriptId}`);
      return;
    }

    $(el).replaceWith(script);
  });

  return $.html();
}

export function applyCustomArbitalScripts(html: string) {
  console.log('applyCustomArbitalScripts', html.slice(0, 100));

  if (!isLWorAF) {
    return html;
  }

  return applyArbitalPathReplacements(html);
}
