import { Head, Utils } from './vulcan-lib';

// add permanent <link /> markup
Head.link.push({
  name: 'rss',
  rel: 'alternate', 
  type: 'application/rss+xml',
  href: `${Utils.getSiteUrl()}feed.xml`
});
