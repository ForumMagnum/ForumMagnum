import { HtmlToTextOptions, htmlToText } from "html-to-text";

const defaultHtmlToTextOptions: HtmlToTextOptions = {
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
};

export const htmlToTextDefault = (html: string = "") =>
  htmlToText(html, defaultHtmlToTextOptions);
