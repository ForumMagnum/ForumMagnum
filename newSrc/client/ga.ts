import LogRocket from 'logrocket'
import { googleTagManagerIdSetting, logRocketApiKeySetting } from '../lib/publicSettings';
import { addCallback } from '../lib/vulcan-lib/callbacks';


function googleTagManagerInit() {
  const googleTagManagerId = googleTagManagerIdSetting.get()
  if (googleTagManagerId) {
    (function (w: any, d: any, s: any, l: any, i: any) {
      w[l] = w[l] || [];
      if (w[l]?.[0]?.['gtm.start']) {
        //eslint-disable-next-line no-console
        console.warn('googleTagManagerInit has already run, aborting')
        return
      }
      w[l].push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
      var f = d.getElementsByTagName(s)[0]
      var j = d.createElement(s)
      var dl = l != 'dataLayer' ? '&l=' + l : '';
      (j as any).async = true;
      (j as any).src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      (f as any).parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', googleTagManagerId)
  }
}

googleTagManagerInit();

const identifyLogRocketCallback = (currentUser: UsersCurrent) => {
  const logRocketKey = logRocketApiKeySetting.get()
  if (!logRocketKey) return

  LogRocket.init(logRocketKey)
  const { karma = 0, afKarma = 0, createdAt, username, displayName: lWDisplayName } = currentUser
  const additionalData = { karma, afKarma, createdAt: createdAt.toString(), username, lWDisplayName }
  LogRocket.identify(currentUser._id, {
    // Don't show user display names by default
    displayName: currentUser._id,
    email: currentUser.email,
    // Custom LessWrong variables
    ...additionalData
  })
}

addCallback("events.identify", identifyLogRocketCallback);
