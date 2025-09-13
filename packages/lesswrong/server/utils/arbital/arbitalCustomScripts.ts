import { isLWorAF } from "@/lib/instanceSettings";
import { cheerioParse } from "../htmlUtil";

const getArbitalScripts = async (): Promise<Record<string, string>> => {
  const bayesGuideHtml = `<div class="question-container">
  <h2>Which case fits you best?</h2>

  <div class="options">
    <label class="option">
      <input id="bayes-guide-basic-radio" type="radio" name="preference" value="basic" data-not-wants="62d,62f" onchange="handleRadioChange(document.getElementById('bayes-guide-basic-radio'))" />
      <span for="bayes-guide-basic-radio">I want to have a basic theoretical and practical understanding of the Bayes' rule.</span>
    </label>

    <label class="option">
      <input id="bayes-guide-quick-radio" type="radio" name="preference" value="quick" data-wants="62d" data-not-wants="62f" onchange="handleRadioChange(document.getElementById('bayes-guide-quick-radio'))" />
      <span for="bayes-guide-quick-radio"
        >I can easily read algebra and don't mind the explanation moving at a fast pace. Just give me the basics,
        quick!
      </span>
    </label>

    <label class="option">
      <input id="bayes-guide-theoretical-radio" type="radio" name="preference" value="theoretical" data-wants="62f" data-not-wants="62d" onchange="handleRadioChange(document.getElementById('bayes-guide-theoretical-radio'))" />
      <span for="bayes-guide-theoretical-radio"
        >I want the basics, but I'm also interested in reading more about the theoretical implications and the reasons
        why Bayes' rule is considered so important.
      </span>
    </label>

    <label class="option">
      <input id="bayes-guide-deep-radio" type="radio" name="preference" value="deep" data-wants="62d,62f" onchange="handleRadioChange(document.getElementById('bayes-guide-deep-radio'))" />
      <span for="bayes-guide-deep-radio"
        >I'd like to read everything! I want to have a <em>deep</em> theoretical and practical understanding of the
        Bayes' rule.
      </span>
    </label>
  </div>

  <div id="pathDescription" class="path-description" style="display: none">
    <div class="content"></div>
    <button class="ck-cta-button start-reading" onclick="startPath()" style="display: none">Start Reading</button>
  </div>
</div>
`;

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
  if (!isLWorAF()) {
    return html;
  }

  return applyArbitalPathReplacements(html);
}
