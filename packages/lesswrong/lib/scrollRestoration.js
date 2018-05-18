import { Meteor } from 'meteor/meteor';

/* When refreshing the page, tell the browser to remember the scroll position.
 * Otherwise, users get scrolled to the top of the page.
 */ (See https://github.com/Discordius/Lesswrong2/issues/295#issuecomment-385866050)
function rememberScrollPositionOnPageReload() {
  window.addEventListener('beforeunload', () => {
    if ('scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'auto';
      } catch (e) {}
    }
  });
}

Meteor.startup(() => {
  if (!Meteor.isServer) {
    rememberScrollPositionOnPageReload();
  }
});
