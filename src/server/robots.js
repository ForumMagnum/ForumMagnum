import { getSetting } from 'meteor/vulcan:core';
import { Picker } from 'meteor/meteorhacks:picker';

// Vary robots.txt based on a setting, because we want development servers
// (lessestwrong.com, baserates.org) to not be indexed by search engines.
Picker.route('/robots.txt', ({query}, req, res, next) => {
  if (getSetting('disallowCrawlers', false)) {
    res.end("User-agent: *\nDisallow: /");
  } else {
    res.end("User-agent: *\ncrawl-delay: 5");
  }
});