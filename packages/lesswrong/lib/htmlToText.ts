import { compile } from "html-to-text";
import { parseDocumentFromString } from "@/lib/domParser";

const defaultConverter = compile({
  selectors: [
    {selector: "a", options: {ignoreHref: true}},
    {selector: "img", format: "skip"},
    {selector: "h1", options: {uppercase: false}},
    {selector: "h2", options: {uppercase: false}},
    {selector: "h3", options: {uppercase: false}},
    {selector: "h4", options: {uppercase: false}},
    {selector: "h5", options: {uppercase: false}},
    {selector: "h6", options: {uppercase: false}},
  ],
  wordwrap: false,
});

interface HtmlToTextDefaultOptions {
  fallbackToImageText?: boolean
}

const getImageTextFallback = (html: string): string => {
  const { document } = parseDocumentFromString(html);
  const captions = Array.from(document.querySelectorAll("figcaption"));
  for (const caption of captions) {
    const captionText = caption.textContent?.trim();
    if (captionText) {
      return `[Image: ${captionText}]`;
    }
  }
  const firstImage = document.querySelector("img");
  if (!firstImage) {
    return "";
  }
  const altText = firstImage.getAttribute("alt")?.trim();
  if (altText) {
    return `[Image: ${altText}]`;
  }
  const titleText = firstImage.getAttribute("title")?.trim();
  if (titleText) {
    return `[Image: ${titleText}]`;
  }
  return "[Image]";
}

export const htmlToTextDefault = (html = "", { fallbackToImageText = false }: HtmlToTextDefaultOptions = {}) => {
  const text = defaultConverter(html);
  if (text.trim() || !fallbackToImageText) {
    return text;
  }
  return getImageTextFallback(html)
};
