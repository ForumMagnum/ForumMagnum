import { compile } from "html-to-text";

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

export const htmlToTextDefault = (html = "") => defaultConverter(html);
