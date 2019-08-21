import { importComponent } from 'meteor/vulcan:lib';

importComponent("TableOfContents", () => require('./TableOfContents.jsx'));
importComponent("TableOfContentsList", () => require('./TableOfContentsList.jsx'));
importComponent("TableOfContentsRow", () => require('./TableOfContentsRow.jsx'));
importComponent("AnswerTocRow", () => require('./AnswerTocRow.jsx'));
