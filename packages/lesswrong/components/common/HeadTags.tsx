import React from 'react';
import { Helmet } from 'react-helmet';
import { Components, registerComponent, Utils, getSetting, Head } from '../../lib/vulcan-lib';
import compose from 'lodash/flowRight';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { withApollo } from 'react-apollo';
import '../../lib/registerSettings';

const HeadTags = (props) => {
    const url = props.url || Utils.getSiteUrl();
    const canonicalUrl = props.canonicalUrl || url
    const description = props.description || getSetting('tagline') || getSetting('description');
    const { currentRoute, pathname } = useSubscribedLocation();
    const siteName = getSetting('forumSettings.tabTitle', 'LessWrong 2.0');
    
    const TitleComponent = currentRoute?.titleComponentName ? Components[currentRoute.titleComponentName] : null;
    const titleString = currentRoute?.title || props.title || currentRoute?.subtitle;
    
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
          <meta property='og:url' content={url}/>
          {props.image && <meta property='og:image' content={props.image}/>}
          { /* <meta property='og:title' content={title}/> */ }
          <meta property='og:description' content={description}/>

          {/* twitter */}
          <meta name='twitter:card' content='summary'/>
          {props.image && <meta name='twitter:image:src' content={props.image}/>}
          { /* <meta name='twitter:title' content={title}/> */ }
          <meta name='twitter:description' content={description}/>

          {props.noIndex && <meta name='robots' content='noindex' />}
          <link rel='canonical' href={canonicalUrl}/>
          <link rel='shortcut icon' href={getSetting('faviconUrl', '/img/favicon.ico')}/>

          {Head.meta.map((tag, index) => <meta key={index} {...tag}/>)}
          {Head.link.map((tag, index) => <link key={index} {...tag}/>)}
          {Head.script.map((tag, index) => <script key={index} {...tag}>{tag.contents}</script>)}

        </Helmet>

        {Head.components.map((componentOrArray, index) => {
          let HeadComponent;
          if (Array.isArray(componentOrArray)) {
            const [component, ...hocs] = componentOrArray;
            HeadComponent = compose(...hocs)(component);
          } else {
            HeadComponent = componentOrArray;
          }
          return <HeadComponent key={index} />
        })}

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
