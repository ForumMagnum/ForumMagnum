import React, { Suspense } from 'react';
import { combineUrls, getBasePath, getSiteUrl } from '../../lib/vulcan-lib/utils';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { taglineSetting, tabTitleSetting, tabLongTitleSetting, noIndexSetting } from '../../lib/instanceSettings';
import { toEmbeddableJson } from '../../lib/utils/jsonUtils';
import { Helmet } from "./Helmet";

const HeadTags = ({
  ogUrl: ogUrlProp,
  canonicalUrl: canonicalUrlProp,
  description: descriptionProp,
  title: titleProp,
  image,
  useSmallImage=false,
  noIndex,
}: {
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
    const description = descriptionProp || currentRoute?.description || taglineSetting.get()

    const tabLongTitle = tabLongTitleSetting.get() || tabTitleSetting.get()
    const tabShortTitle = tabTitleSetting.get() || tabLongTitle

    const TitleComponent = currentRoute?.titleComponent;
    const titleString = currentRoute?.title || titleProp || currentRoute?.subtitle;

    const rssUrl = `${getSiteUrl()}feed.xml`
    
    return (
      <React.Fragment>
        { TitleComponent
            ? <Suspense>
                <TitleComponent siteName={tabShortTitle} isSubtitle={false} />
              </Suspense>
            : <Helmet name="title"><title>
                {titleString
                  ? `${titleString} — ${tabShortTitle}`
                  : tabLongTitle}
              </title></Helmet>
        }

        <Helmet key={pathname} name="meta">
          <meta charSet='utf-8'/>
          <meta name='description' content={description}/>
          <meta name='viewport' content='width=device-width, initial-scale=1'/>

          {/* The twitter:card meta tag is in apollo-ssr/components/Head.tsx
            * instead of here because it involves a user-agent sniffing hack :( */}
          
          {image && <meta name='twitter:image:src' content={image}/>}
          { /* <meta name='twitter:title' content={title}/> */ }
          <meta name='twitter:description' content={description}/>

          {/* facebook */}
          <meta property='og:type' content='article'/>
          <meta property='og:url' content={ogUrl}/>
          {image && <meta property='og:image' content={image}/>}
          { /* <meta property='og:title' content={title}/> */ }
          <meta property='og:description' content={description}/>

          <meta httpEquiv='delegate-ch' content='sec-ch-dpr https://res.cloudinary.com;' />

          {(noIndex || currentRoute?.noIndex || noIndexSetting.get()) && <meta name='robots' content='noindex' />}
          <link rel='canonical' href={canonicalUrl}/>

          <link rel="alternate" type="application/rss+xml" href={rssUrl} />
        </Helmet>
      </React.Fragment>
    );
}

export default HeadTags;


