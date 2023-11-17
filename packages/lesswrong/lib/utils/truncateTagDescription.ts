import { isServer } from "../executionEnvironment";
import { truncate } from "../editor/ellipsize";
import { preferredHeadingCase } from "../../themes/forumTheme";

const getInnerHTML = (html: string) => {
  if (isServer) {
    const cheerio = require("cheerio");
    const $ = cheerio.load(html);
    return $("body").html();
  } else {
    return new DOMParser().parseFromString(html, "text/html").body.innerHTML;
  }
}

const truncateTagDescription = (
  htmlWithAnchors: string,
  descriptionTruncationCount?: number,
) => {
  if (descriptionTruncationCount) {
    return truncate(
      htmlWithAnchors,
      descriptionTruncationCount,
      "paragraphs",
      "<span>...<p><a>(Read More)</a></p></span>",
    );
  }
  for (let matchString of [
      'id="Further_reading"',
      'id="Bibliography"',
      'id="Related_entries"',
      'class="footnotes"',
    ]) {
    if(htmlWithAnchors.includes(matchString)) {
      const truncationLength = htmlWithAnchors.indexOf(matchString);
      /**
       * The `truncate` method used above uses a complicated criterion for what
       * counts as a character. Here, we want to truncate at a known index in
       * the string. So rather than using `truncate`, we can slice the string
       * at the desired index, use `parseFromString` to clean up the HTML,
       * and then append our footer 'read more' element.
       */
      const innerHTML = getInnerHTML(htmlWithAnchors.slice(0, truncationLength));
      const readMore = preferredHeadingCase("Read More");
      return innerHTML + `<span>...<p><a>(${readMore})</a></p></span>`;
    }
  }
  return htmlWithAnchors
}

export default truncateTagDescription;
