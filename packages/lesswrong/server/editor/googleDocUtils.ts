import axios from 'axios';
import cheerio from 'cheerio';
import { convertImagesInHTML, uploadBufferToCloudinary } from '../scripts/convertImagesToCloudinary';
import { extractTableOfContents } from '@/lib/tableOfContents';
import { dataToCkEditor } from './conversionUtils';
import { parseDocumentFromString } from '@/lib/domParser';

/**
 * Convert the footnotes we get in google doc html to a format ckeditor can understand. This is mirroring the logic
 * in the footnotes plugin (see e.g. ckEditor/src/ckeditor5-footnote/src/footnoteEditing/googleDocsFootnotesNormalizer.js)
 */
function googleDocConvertFootnotes(html: string): string {
  const $ = cheerio.load(html);

  const footnotePattern = /^ftnt(\d+)$/; // The actual footnotes at the bottom of the doc
  const referencePattern = /^ftnt_ref(\d+)$/; // The links to the footnotes in the main text

  const footnotes: Record<string, { item: cheerio.Cheerio; anchor: cheerio.Cheerio, id: string }> = {};
  $('a[id]').each((_, element) => {
    if (!('attribs' in element)) return

    const match = element.attribs.id.match(footnotePattern);
    if (match) {
      const index = match[1];
      // Find the closest parent div of the footnote anchor
      const footnoteDiv = $(element).closest('div');
      footnotes[index] = {
        item: footnoteDiv,
        anchor: $(element),
        id: Math.random().toString(36).slice(2),
      };
    }
  });

  if (Object.keys(footnotes).length === 0) {
    return $.html();
  }

  const references: Record<string, { item: cheerio.Cheerio; id: string }> = {};
  $('a[id]').each((_, element) => {
    if (!('attribs' in element)) return

    const match = element.attribs.id.match(referencePattern);
    if (match) {
      const index = match[1];
      if (footnotes.hasOwnProperty(index)) {
        references[index] = {
          item: $(element),
          id: footnotes[index].id,
        };
      }
    }
  });

  // Normalize the references by adding attributes and replacing the original <sup> tag
  Object.entries(references).forEach(([index, { item, id }]) => {
    item.attr('data-footnote-reference', '');
    item.attr('data-footnote-index', index);
    item.attr('data-footnote-id', id);
    item.attr('role', 'doc-noteref');
    item.parents('sup').replaceWith(item); // Replace the original <sup> tag with `item`
    item.wrap(`<span class="footnote-reference" id="fnref${id}"></span>`);
    item.text(`[${index}]`);
  });

  // Create the footnotes section
  $('body').append('<ol class="footnote-section footnotes" data-footnote-section="" role="doc-endnotes"></ol>');

  // Normalize the footnotes and put them in the newly created section
  Object.entries(footnotes).forEach(([index, { item, anchor, id }]) => {
    // Remove e.g. "[1]&nbsp;" from the footnote
    const anchorHtml = anchor.html();
    if (anchorHtml && anchorHtml.startsWith('&nbsp;')) {
      anchor.html(anchorHtml.replace(/^&nbsp;/, ''));
    } else {
      anchor.remove();
    }

    const footnoteContent = item.clone().addClass('footnote-content');

    // Replace bullets in footnotes with regular <p> elements and move them up a level
    const listParent = footnoteContent.find('li').parent('ul, ol');
    listParent.children('li').each((_, liElement) => {
      const liContent = $(liElement).html();
      $(`<p>${liContent}</p>`).insertBefore(listParent);
    });
    listParent.remove();

    const newFootnoteBackLink = $('<span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="' + id + '"><sup><strong><a href="#fnref' + id + '">^</a></strong></sup></span>');

    const newFootnoteContent = $('<div class="footnote-content" data-footnote-content="" data-footnote-id="' + id + '" data-footnote-index="' + index + '"></div>');
    newFootnoteContent.append(footnoteContent.contents());

    const newFootnoteItem = $('<li class="footnote-item" data-footnote-item="" data-footnote-id="' + id + '" data-footnote-index="' + index + '" role="doc-endnote" id="fn' + id + '"></li>');
    newFootnoteItem.append(newFootnoteBackLink);
    newFootnoteItem.append(newFootnoteContent);

    $('.footnote-section').append(newFootnoteItem);
    item.remove()
  });

  // The changes so far leave over a stub like so:
  // <hr />
  //   <div>
  //     <p></p>
  //   </div>
  //   ...
  // <ol class=\"footnotes\" role=\"doc-endnotes\">
  //
  // Remove everything from the <hr /> to the footnotes section
  const footnotesSection = $('.footnote-section');
  const hrBeforeFootnotes = footnotesSection.prevAll('hr').last();
  hrBeforeFootnotes.remove();

  return $.html();
}

/**
 * Remote the google redirect from links that come from google docs
 *
 * https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page becomes https://en.wikipedia.org/wiki/Main_Page
 */
function googleDocRemoveRedirects(html: string): string {
  const $ = cheerio.load(html);

  // Regex match examples:
  // https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page&sa=D&source=editors&ust=1667922372715536&usg=AOvVaw2NyT5CZhfsrRY_zzMs2UUJ
  //                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ <- first match group matches this, stopping at the first &
  // https://www.google.com/url?q=https://en.wikipedia.org/wiki/Main_Page
  //                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ <- if there are no more params (no &), match up to the end of the string
  const hrefPattern = /^https:\/\/www\.google\.com\/url\?q=(\S+?)(&|$)/;

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return

    const match = hrefPattern.exec(href);
    if (match && match[1]) {
      $(element).attr('href', decodeURIComponent(match[1]));
    }
  });

  return $.html();
}

/**
 * Converts Google Docs formatting to ckeditor formatting. Currently handles:
 * - Italics
 * - Bold
 */
function googleDocTextFormatting(html: string): string {
  const $ = cheerio.load(html);

  $('span').each((_, element) => {
    const span = $(element);
    const fontStyle = span.css('font-style');
    const fontWeight = span.css('font-weight');

    if (fontStyle === 'italic' && fontWeight === '700') {
      span.wrap('<i><strong></strong></i>');
    } else if (fontStyle === 'italic') {
      span.wrap('<i></i>');
    } else if (fontWeight === '700') {
      span.wrap('<strong></strong>');
    }
  });

  return $.html();
}

/**
 * Convert the CSS based "cropping" in the imported html into actual cropping
 */
async function googleDocCropImages(html: string): Promise<string> {
  // Example of CSS-based cropping:
  // <p>
  //   <span style="overflow: hidden; display: inline-block; width: 396.00px; height: 322.40px;">
  //     <img src="https://example.com/image.jpg"
  //          style="width: 602.00px; height: 427.97px; margin-left: -110.00px; margin-top: -48.60px;">
  //   </span>
  // <p>

  const $ = cheerio.load(html);

  const cropPromises = $('p > span:has(> img)').map(async (_, span) => {
    const $span = $(span);
    const $img = $span.find('img');

    if ($img.length === 0) return;

    const spanStyle = $span.attr('style');
    const imgStyle = $img.attr('style');
    const src = $img.attr('src');

    if (!spanStyle || !imgStyle || !src) return;

    const spanWidth = parseFloat(spanStyle.match(/width:\s*([\d.]+)px/)?.[1] || '0');
    const spanHeight = parseFloat(spanStyle.match(/height:\s*([\d.]+)px/)?.[1] || '0');
    const imgWidth = parseFloat(imgStyle.match(/width:\s*([\d.]+)px/)?.[1] || '0');
    const imgHeight = parseFloat(imgStyle.match(/height:\s*([\d.]+)px/)?.[1] || '0');
    const marginLeft = parseFloat(imgStyle.match(/margin-left:\s*([-\d.]+)px/)?.[1] || '0');
    const marginTop = parseFloat(imgStyle.match(/margin-top:\s*([-\d.]+)px/)?.[1] || '0');

    if (imgWidth === 0 || imgHeight === 0) {
      return
    }

    const leftRelative = Math.max(-marginLeft, 0) / imgWidth;
    const topRelative = Math.max(-marginTop, 0) / imgHeight;
    const widthRelative = Math.round(spanWidth) / imgWidth;
    const heightRelative = Math.round(spanHeight) / imgHeight;

    if (leftRelative === 0 && topRelative === 0 && widthRelative === 1 && heightRelative === 1) {
      return
    }

    try {
      const response = await axios.get(src, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');

      const { default: Jimp } = await import('jimp');
      const image = await Jimp.read(buffer);
      const originalWidth = image.bitmap.width;
      const originalHeight = image.bitmap.height;

      if (!originalWidth || !originalHeight) {
        throw new Error(`width or height not defined for image`)
      }

      const leftPixels = Math.round(leftRelative * originalWidth)
      const topPixels = Math.round(topRelative * originalHeight)
      const widthPixels = Math.min(Math.round(widthRelative * originalWidth), originalWidth - leftPixels)
      const heightPixels = Math.min(Math.round(heightRelative * originalHeight), originalHeight - topPixels)

      const croppedImage = await image.crop(leftPixels, topPixels, widthPixels, heightPixels);
      const croppedBuffer = await croppedImage.getBufferAsync(image.getMIME());

      const url = await uploadBufferToCloudinary(croppedBuffer)

      if (!url) {
        throw new Error(`Failed to upload cropped image to cloudinary`)
      }

      $img.attr('src', url);
      $img.attr('style', `width: ${widthPixels}px; height: ${heightPixels}px;`);
      $span.replaceWith($img);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error cropping image, falling back to uncropped version. src: ${src}`, error);
    }
  }).get();

  await Promise.all(cropPromises);

  return $.html();
}

/**
 * Removes comments from the raw html exported from Google Docs.
 */
function googleDocStripComments(html: string): string {
  const $ = cheerio.load(html);

  // Remove any <sup> tags that contain a child with a #cmnt id
  $('sup').each((_, element) => {
    const sup = $(element);
    if (sup.find('a[id^="cmnt_ref"]').length > 0) {
      sup.remove();
    }
  });

  // Remove the whole box at the bottom containing the comments
  $('div').each((_, element) => {
    const div = $(element);
    if (div.find('a[id^="cmnt"]').length > 0) {
      div.remove();
    }
  });

  return $.html();
}

/**
 * Converts internal links in Google Docs HTML to a format with `data-internal-id` attributes on block level elements.
 * This is used to maintain internal document links when importing into ckeditor, which doesn't use `id` attributes
 * on elements for internal linking.
 */
async function googleDocInternalLinks(html: string): Promise<string> {
  const $ = cheerio.load(html);

  // Define block level elements that are considered as blocks in ckeditor
  const blockLevelElements = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'li', 'blockquote', 'pre', 'hr', 'table'];

  // Map id to data-internal-id
  $('[id]').each((_, element) => {
    // Remove the id attribute and store its value
    const idValue = $(element).attr('id');
    $(element).removeAttr('id');

    // Find the nearest parent that is a block level element
    const blockParent = $(element).closest(blockLevelElements.join(','));

    if (blockParent.length && idValue) {
      blockParent.attr('data-internal-id', idValue)
    }
  });

  const tocHtml = (await extractTableOfContents(parseDocumentFromString($.html())))?.html;
  if (tocHtml) {
    const idMap: Record<string, string> = {};
    const $toc = cheerio.load(tocHtml);
    $toc('[id][data-internal-id]').each((_, element) => {
      const readableId = $toc(element).attr('id');
      const internalId = $toc(element).attr('data-internal-id');
      if (readableId && internalId) {
        idMap[internalId] = readableId;
      }
    });

    // Update all hrefs to point to the readable ids
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('#')) {
        const internalId = href.slice(1);
        if (idMap[internalId]) {
          $(element).attr('href', `#${idMap[internalId]}`);
        }
      }
    });

    // Update the data-internal-ids to be equal to the readable id, this
    // means that even if they change the heading the links will still work
    $('[data-internal-id]').each((_, element) => {
      const internalId = $(element).attr('data-internal-id');
      if (internalId && idMap[internalId]) {
        $(element).attr('data-internal-id', idMap[internalId]);
      }
    });
  }

  return $.html();
}

/**
 * Handle footnotes and internal links. These are bundled together because they must
 * be done in the right order
 */
function googleDocConvertLinks(html: string) {
  const withNormalizedFootnotes = googleDocConvertFootnotes(html);
  const withInternalLinks = googleDocInternalLinks(withNormalizedFootnotes);
  return withInternalLinks
}

/**
 * In google docs nested bullets are handled through styling (each indentation level is actually
 * a separate list, with a margin-left creating the effect of nesting). In ckeditor, nested bullets are
 * actually <ul>s nested within each other. Convert this styling based nesting to genuine nesting
 */
function googleDocConvertNestedBullets(html: string): string {
  const $ = cheerio.load(html);

  // Each nesting level (<ul> or <ol> group) has a class like lst-kix_gwukp0509sil-0, or lst-kix_gwukp0509sil-1
  // The number at the end indicates the level of indentation, and the group a nesting level corresponds to
  // can be inferred from the fact that it is part of a continuous block of <ul>/<ol>s with nothing in between
  const listGroups: Record<string, {element: cheerio.Cheerio, index: number}[]> = {};
  let currentGroupId = 0;
  let lastListElement: cheerio.Element | null = null;

  $('ul[class*="lst-"], ol[class*="lst-"]').each((_, element) => {
    // If the current list element is not immediately after the last one, it's a new group
    if (!lastListElement || (element.prev && !$(element.prev).is(lastListElement))) {
      currentGroupId++;
    }
    lastListElement = element;

    const classNames = $(element).attr('class')?.split(/\s+/);
    const listClass = classNames?.find(name => name.startsWith('lst-'));
    if (!listClass) return;

    const match = listClass.match(/lst-([a-z_0-9]+)-(\d+)/);
    if (!match) return;

    const [ , , index] = match;
    if (!listGroups[currentGroupId]) {
      listGroups[currentGroupId] = [];
    }
    listGroups[currentGroupId].push({ element: $(element), index: parseInt(index) });
  });

  // Adjust the indices to account for contraints in ckeditor, and convert to genuine nesting
  for (const group of Object.values(listGroups)) {
    // In ckeditor, lists aren't allowed to start indented
    group[0].index = 0;

    // Indices can only increase by 1 from element to element
    for (let i = 1; i < group.length; i++) {
      if (group[i].index > group[i-1].index + 1) {
        group[i].index = group[i-1].index + 1;
      }
    }

    // Convert to genuine nesting
    group.forEach((item, i, arr) => {
      if (i > 0) {
        const prevItem = arr[i - 1];
        if (item.index === prevItem.index + 1) {
          prevItem.element.children('li:last-child').append(item.element);
        } else if (item.index <= prevItem.index) {
          // Find the ancestor list that matches the current index
          let ancestor = prevItem.element;
          for (let j = 0; j < prevItem.index - item.index; j++) {
            ancestor = ancestor.parent().closest('ul, ol');
          }
          ancestor.after(item.element);
        }
      }
    });
  };

  return $.html();
}

/**
 * To fix double spacing, remove all empty <p> tags that are immediate children of <body> from the HTML
 */
function removeEmptyBodyParagraphs(html: string): string {
  const $ = cheerio.load(html);

  $('body > p').each((_, element) => {
    const p = $(element);
    // Allow otherwise empty paragraphs containing images
    if (p.text().trim() === '' && p.find('img').length === 0) {
      p.remove();
    }
  });

  return $.html();
}

/**
 * We need to convert a few things in the raw html exported from google to make it work with ckeditor, this is
 * largely mirroring conversions we do on paste in the ckeditor code:
 * - Convert footnotes to our format
 * - Remove google redirects from all urls
 * - Reupload images to cloudinary (we actually don't do this on paste, but it's easier to do so here and prevents images breaking due to rate limits)
 */
export async function convertImportedGoogleDoc({
  html,
  postId,
}: {
  html: string;
  postId: string;
}) {
  const converters: (((html: string) => Promise<string>) | ((html: string) => string))[] = [
    async (html: string) => {
      const { html: rehostedHtml } = await convertImagesInHTML(html, postId, (url) =>
        url.includes("googleusercontent")
      );
      return rehostedHtml;
    },
    googleDocStripComments,
    googleDocCropImages,
    googleDocTextFormatting,
    googleDocConvertLinks,
    googleDocRemoveRedirects,
    googleDocConvertNestedBullets, // Must come before removeEmptyBodyParagraphs because paragraph breaks are used to determine when to break up a nested list of bullets
    removeEmptyBodyParagraphs,
    async (html: string) => await dataToCkEditor(html, "html"),
  ];

  let result: string = html;
  // Apply each converter in sequence
  for (const converter of converters) {
    result = await converter(result);
  }

  return result;
}
