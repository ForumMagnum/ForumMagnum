import { HtmlToTextOptions, compile } from "html-to-text";

const defaultOptions: HtmlToTextOptions = {
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
}

const defaultConverter = compile(defaultOptions);

const truncatedConverter = compile({
  ...defaultOptions,
  limits: {
    maxBaseElements: 1,
  },
});

export const htmlToTextDefault = (html = "") => defaultConverter(html);

export const htmlToTextTruncated = (html = "") => defaultConverter(html);
