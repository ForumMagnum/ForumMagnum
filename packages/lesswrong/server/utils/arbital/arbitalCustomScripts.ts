import { isLWorAF } from "@/lib/instanceSettings";
import { cheerioParse } from "../htmlUtil";
import { readFile } from "fs/promises";
import { join } from "path";

const getBayesGuideHtml = (() => {
  let html: string | undefined;
  return async () => {
    // if (html) {
    //   return html;
    // }

    const path = 'packages/lesswrong/server/utils/arbital/resources/bayesGuideMultipleChoice.html';

    html = await readFile(path, 'utf8');
    return html;
  }
})();

const getArbitalScripts = async (): Promise<Record<string, string>> => {
  const bayesGuideHtml = await getBayesGuideHtml();

  return {
    '1zq': bayesGuideHtml,
  };
};

async function applyArbitalPathReplacements(html: string) {
  const arbitalScripts = await getArbitalScripts();
  const $ = cheerioParse(html);

  $('[class^="arb-custom-script-"]').each((idx, el) => {
    const scriptId = $(el).attr('class')?.split('-')[3];
    if (!scriptId) {
      return;
    }

    const script: string = arbitalScripts[scriptId];
    if (!script) {
      // eslint-disable-next-line no-console
      console.error(`No script found for id ${scriptId}`);
      return;
    }

    // Remove all the wants-requisite elements that are associated with this script
    $(`[class="arb-wants-requisite-${scriptId}"]`).remove();

    $(el).replaceWith(script);
  });

  return $.html();
}

export function applyCustomArbitalScripts(html: string) {
  if (!isLWorAF) {
    return html;
  }

  return applyArbitalPathReplacements(html);
}
