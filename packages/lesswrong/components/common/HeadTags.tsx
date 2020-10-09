import React from 'react';
import { Helmet } from 'react-helmet';
import { Components, registerComponent, Utils } from '../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { withApollo } from '@apollo/client/react/hoc';
import { PublicInstanceSetting } from '../../lib/instanceSettings';

export const taglineSetting = new PublicInstanceSetting<string>('tagline', "A community blog devoted to refining the art of rationality", "warning")
export const faviconUrlSetting = new PublicInstanceSetting<string>('faviconUrl', '/img/favicon.ico', "warning")
const tabTitleSetting = new PublicInstanceSetting<string>('forumSettings.tabTitle', 'LessWrong', "warning")


const HeadTags = (props) => {
    const { currentRoute, pathname } = useSubscribedLocation();
    // The default url we want to use for our cannonical and og:url tags uses
    // the "base" path, site url and path without query or hash
    const url = Utils.combineUrls(Utils.getSiteUrl(), Utils.getBasePath(pathname))
    const ogUrl = props.ogUrl || url
    const canonicalUrl = props.canonicalUrl || url
    const description = props.description || taglineSetting.get()
    const siteName = tabTitleSetting.get()
    
    const TitleComponent: any = currentRoute?.titleComponentName ? Components[currentRoute.titleComponentName] : null;
    const titleString = currentRoute?.title || props.title || currentRoute?.subtitle;
    
    const rssUrl = `${Utils.getSiteUrl()}feed.xml`
    
    return (
      <React.Fragment>
        { TitleComponent
            ? <TitleComponent siteName={siteName} isSubtitle={false} />
            : <Helmet><title>
                {titleString
                  ? `${titleString} - ${siteName}`
                  : siteName}
              </title></Helmet>
        }

        <Helmet key={pathname}>
          <meta charSet='utf-8'/>
          <meta name='description' content={description}/>
          <meta name='viewport' content='width=device-width, initial-scale=1'/>

          {/* facebook */}
          <meta property='og:type' content='article'/>
          <meta property='og:url' content={ogUrl}/>
          {props.image && <meta property='og:image' content={props.image}/>}
          { /* <meta property='og:title' content={title}/> */ }
          <meta property='og:description' content={description}/>

          {/* twitter */}
          <meta name='twitter:card' content='summary'/>
          {props.image && <meta name='twitter:image:src' content={props.image}/>}
          { /* <meta name='twitter:title' content={title}/> */ }
          <meta name='twitter:description' content={description}/>

          {(props.noIndex || currentRoute?.noIndex) && <meta name='robots' content='noindex' />}
          <link rel='canonical' href={canonicalUrl}/>
          <link rel='shortcut icon' href={faviconUrlSetting.get()}/>

          <link rel="alternate" type="application/rss+xml" href={rssUrl} />
        </Helmet>
      </React.Fragment>
    );
}

const HeadTagsComponent = registerComponent('HeadTags', HeadTags, {
  hocs: [withApollo]
});

declare global {
  interface ComponentTypes {
    HeadTags: typeof HeadTagsComponent
  }
}
