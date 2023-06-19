import React from 'react';
import { Helmet } from 'react-helmet';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { combineUrls, getBasePath, getSiteUrl } from '../../lib/vulcan-lib/utils';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { PublicInstanceSetting } from '../../lib/instanceSettings';

export const taglineSetting = new PublicInstanceSetting<string>('tagline', "A community blog devoted to refining the art of rationality", "warning")
export const faviconUrlSetting = new PublicInstanceSetting<string>('faviconUrl', '/img/favicon.ico', "warning")
const tabTitleSetting = new PublicInstanceSetting<string>('forumSettings.tabTitle', 'LessWrong', "warning")


const HeadTags = ({ogUrl: ogUrlProp, canonicalUrl: canonicalUrlProp, description: descriptionProp, title: titleProp, image, useSmallImage=false, noIndex}: {
  ogUrl?: string,
  canonicalUrl?: string,
  description?: string|null,
  title?: string,
  image?: string|null,
  useSmallImage?: boolean,
  noIndex?: boolean,
}) => {
    const { currentRoute, pathname } = useSubscribedLocation();
    // The default url we want to use for our cannonical and og:url tags uses
    // the "base" path, site url and path without query or hash
    const url = combineUrls(getSiteUrl(), getBasePath(pathname))
    const ogUrl = ogUrlProp || url
    const canonicalUrl = canonicalUrlProp || url
    const description = descriptionProp || currentRoute.description || taglineSetting.get()
    const siteName = tabTitleSetting.get()

    const TitleComponent: any = currentRoute?.titleComponentName ? Components[currentRoute.titleComponentName] : null;
    const titleString = currentRoute?.title || titleProp || currentRoute?.subtitle;

    const rssUrl = `${getSiteUrl()}feed.xml`

    return (
      <React.Fragment>
        { TitleComponent
            ? <TitleComponent siteName={siteName} isSubtitle={false} />
            : <Helmet><title>
                {titleString
                  ? `${titleString} — ${siteName}`
                  : siteName}
              </title></Helmet>
        }

        <Helmet key={pathname}>
          <meta charSet='utf-8'/>
          <meta name='description' content={description}/>
          <meta name='viewport' content='width=device-width, initial-scale=1'/>

          {/* twitter */}
          <meta name='twitter:card' content={useSmallImage ? 'summary' : 'summary_large_image'}/>
          {image && <meta name='twitter:image:src' content={image}/>}
          { /* <meta name='twitter:title' content={title}/> */ }
          <meta name='twitter:description' content={description}/>

          {/* facebook */}
          <meta property='og:type' content='article'/>
          <meta property='og:url' content={ogUrl}/>
          {image && <meta property='og:image' content={image}/>}
          { /* <meta property='og:title' content={title}/> */ }
          <meta property='og:description' content={description}/>

          {(noIndex || currentRoute?.noIndex) && <meta name='robots' content='noindex' />}
          <link rel='canonical' href={canonicalUrl}/>
          <link rel='shortcut icon' href={faviconUrlSetting.get()}/>

          <link rel="alternate" type="application/rss+xml" href={rssUrl} />
        </Helmet>
      </React.Fragment>
    );
}

const HeadTagsComponent = registerComponent('HeadTags', HeadTags);

declare global {
  interface ComponentTypes {
    HeadTags: typeof HeadTagsComponent
  }
}
