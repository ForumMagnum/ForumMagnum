import { importComponent } from 'meteor/vulcan:lib';

importComponent("TableOfContents", () => require('./TableOfContents'));
importComponent("TableOfContentsList", () => require('./TableOfContentsList'));
importComponent("TableOfContentsRow", () => require('./TableOfContentsRow'));
importComponent("AnswerTocRow", () => require('./AnswerTocRow'));
