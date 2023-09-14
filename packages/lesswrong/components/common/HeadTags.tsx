import React from 'react';
import { Helmet } from 'react-helmet';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { combineUrls, getBasePath, getSiteUrl } from '../../lib/vulcan-lib/utils';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { PublicInstanceSetting } from '../../lib/instanceSettings';
import { toEmbeddableJson } from '../../lib/utils/jsonUtils';

export const taglineSetting = new PublicInstanceSetting<string>('tagline', "A community blog devoted to refining the art of rationality", "warning")
export const faviconUrlSetting = new PublicInstanceSetting<string>('faviconUrl', '/img/favicon.ico', "warning")
export const faviconWithBadgeSetting = new PublicInstanceSetting<string|null>('faviconWithBadge', null, "optional")
const tabTitleSetting = new PublicInstanceSetting<string>('forumSettings.tabTitle', 'LessWrong', "warning")
const tabLongTitleSetting = new PublicInstanceSetting<string | null>('forumSettings.tabLongTitle', null, "optional")

const noIndexSetting = new PublicInstanceSetting<boolean>('noindex', false, "optional")

const HeadTags = ({
  ogUrl: ogUrlProp,
  canonicalUrl: canonicalUrlProp,
  description: descriptionProp,
  title: titleProp,
  image,
  useSmallImage=false,
  noIndex,
  structuredData
}: {
  ogUrl?: string,
  canonicalUrl?: string,
  description?: string|null,
  title?: string,
  image?: string|null,
  useSmallImage?: boolean,
  noIndex?: boolean,
  structuredData?: Record<string, AnyBecauseHard>,
}) => {
    const { currentRoute, pathname } = useSubscribedLocation();
    // The default url we want to use for our cannonical and og:url tags uses
    // the "base" path, site url and path without query or hash
    const url = combineUrls(getSiteUrl(), getBasePath(pathname))
    const ogUrl = ogUrlProp || url
    const canonicalUrl = canonicalUrlProp || url
    const description = descriptionProp || currentRoute?.description || taglineSetting.get()

    const tabLongTitle = tabLongTitleSetting.get() || tabTitleSetting.get()
    const tabShortTitle = tabTitleSetting.get() || tabLongTitle

    const TitleComponent: any = currentRoute?.titleComponentName ? Components[currentRoute.titleComponentName] : null;
    const titleString = currentRoute?.title || titleProp || currentRoute?.subtitle;

    const rssUrl = `${getSiteUrl()}feed.xml`

    return (
      <React.Fragment>
        { TitleComponent
            ? <TitleComponent siteName={tabShortTitle} isSubtitle={false} />
            : <Helmet><title>
                {titleString
                  ? `${titleString} — ${tabShortTitle}`
                  : tabLongTitle}
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

          {(noIndex || currentRoute?.noIndex || noIndexSetting.get()) && <meta name='robots' content='noindex' />}
          <link rel='canonical' href={canonicalUrl}/>

          <link rel="alternate" type="application/rss+xml" href={rssUrl} />

          {/* See https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data */}
          {structuredData && <script type="application/ld+json">
            {toEmbeddableJson(structuredData)}
          </script>}
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
