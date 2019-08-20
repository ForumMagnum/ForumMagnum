import { importComponent } from 'meteor/vulcan:lib';

importComponent("PostsPage", () => require('./PostsPage.jsx'));
importComponent("PostsPageDate", () => require('./PostsPageDate.jsx'));
importComponent("PostsPageWrapper", () => require('./PostsPageWrapper.jsx'));
importComponent("PostsAuthors", () => require('./PostsAuthors.jsx'));
importComponent("PostsPageTitle", () => require('./PostsPageTitle.jsx'));
importComponent("PostsTopSequencesNav", () => require('./PostsTopSequencesNav.jsx'));
importComponent("PostsPageEventData", () => require('./PostsPageEventData.jsx'));
importComponent("PostsPageActions", () => require('./PostsPageActions.jsx'));
importComponent("PostActions", () => require('./PostActions.jsx'));
importComponent("ContentType", () => require('./ContentType.jsx'));
importComponent("PostsRevisionSelector", () => require('./PostsRevisionSelector.jsx'));
importComponent("PostsRevisionsList", () => require('./PostsRevisionsList.jsx'));
importComponent("PostsRevisionMessage", () => require('./PostsRevisionMessage.jsx'));
