import { importComponent } from '../../../lib/vulcan-lib';

importComponent("TableOfContents", () => require('./TableOfContents'));
importComponent("TableOfContentsList", () => require('./TableOfContentsList'));
importComponent("TableOfContentsRow", () => require('./TableOfContentsRow'));
importComponent("AnswerTocRow", () => require('./AnswerTocRow'));
importComponent("ToCColumn", () => require('./ToCColumn'));
importComponent("DynamicTableOfContents", () => require('./DynamicTableOfContents'));
