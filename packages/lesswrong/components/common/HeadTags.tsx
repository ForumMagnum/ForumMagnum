import React from 'react';
import { combineUrls, getBasePath, getSiteUrl } from '../../lib/vulcan-lib/utils';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { taglineSetting, tabTitleSetting, tabLongTitleSetting, noIndexSetting } from '../../lib/instanceSettings';
import { Helmet } from "@/components/layout/Helmet";
import { SuspenseWrapper } from './SuspenseWrapper';
import { useRouteMetadata } from '@/components/layout/ClientRouteMetadataContext';

const HeadTags = () => {
    const { pathname } = useSubscribedLocation();
    const routeMetadata = useRouteMetadata().metadata;
    // The default url we want to use for our cannonical and og:url tags uses
    // the "base" path, site url and path without query or hash
    const url = combineUrls(getSiteUrl(), getBasePath(pathname))
    const ogUrl = url
    const canonicalUrl = url
    // FIXME: Routes table has a "description" option for a few routes, which has probably not been transferred into nextjs
    //const description = routeMetadata?.description || taglineSetting.get()
    const description = taglineSetting.get()

    const tabLongTitle = tabLongTitleSetting.get() || tabTitleSetting.get()
    const tabShortTitle = tabTitleSetting.get() || tabLongTitle

    const TitleComponent = routeMetadata?.titleComponent;
    const titleString = routeMetadata?.title || routeMetadata?.subtitle;

    const rssUrl = `${getSiteUrl()}feed.xml`
    
    return (
      <React.Fragment>
        { TitleComponent
            ? <SuspenseWrapper name="TitleComponent">
                <TitleComponent siteName={tabShortTitle} isSubtitle={false} />
              </SuspenseWrapper>
            : <Helmet name="title"><title>
                {titleString
                  ? `${titleString} — ${tabShortTitle}`
                  : tabLongTitle}
              </title></Helmet>
        }

        <Helmet key={pathname} name="meta">
          {/* done in default */}
          <meta name='description' content={description}/>

          {/* The twitter:card meta tag is in apollo-ssr/components/Head.tsx
            * instead of here because it involves a user-agent sniffing hack :( */}
          
          { /* <meta name='twitter:title' content={title}/> */ }
          {/* done in default */}
          <meta name='twitter:description' content={description}/>

          {/* facebook */}
          {/* done */}
          <meta property='og:type' content='article'/>
          {/* done in default */}
          <meta property='og:url' content={ogUrl}/>
          { /* <meta property='og:title' content={title}/> */ }
          {/* done in default */}
          <meta property='og:description' content={description}/>

          {/* done */}
          <meta httpEquiv='delegate-ch' content='sec-ch-dpr https://res.cloudinary.com;' />

          {/* done in default */}
          <link rel='canonical' href={canonicalUrl}/>
          {/* done */}
          <link rel="alternate" type="application/rss+xml" href={rssUrl} />
        </Helmet>
      </React.Fragment>
    );
}

export default HeadTags;


