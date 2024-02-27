import { addStaticRoute } from "./vulcan-lib";
import { forumTitleSetting, faviconUrlSetting } from '../lib/instanceSettings';

addStaticRoute("/manifest.json", (query,req,res,next) => {
  const manifest = {
    "short_name": forumTitleSetting.get(),
    "name": forumTitleSetting.get(),
    "start_url": "/",
    "icons": [
      {
        "src": "https://res.cloudinary.com/lesswrong-2-0/image/upload/w_144,h_144/v1497915096/favicon_lncumn.ico", //TODO make this use settings
        "sizes": "144x144",
        "purpose": "any",
        "type": "image/webp"
      }
    ],
    "display": "standalone"
  };

  res.setHeader("Content-Type", "application/manifest+json");
  res.end(JSON.stringify(manifest));
});
