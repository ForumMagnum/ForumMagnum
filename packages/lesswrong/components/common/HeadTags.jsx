import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Utils, getSetting, Head } from 'meteor/vulcan:lib';
import { compose } from 'react-apollo';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { withApollo } from 'react-apollo';

const TitleComponent = ({titleString}) => {
  const siteName = getSetting('forumSettings.tabTitle', 'LessWrong 2.0');
  return <Helmet>
    <title>{`${titleString} - ${siteName}`}</title>
  </Helmet>
}

const HeadTags = (props) => {
    const url = props.url || Utils.getSiteUrl();
    const description = props.description || getSetting('tagline') || getSetting('description');
    const { currentRoute, pathname } = useSubscribedLocation();
    const siteName = getSetting('forumSettings.tabTitle', 'LessWrong 2.0');
    
    const TitleComponent = currentRoute?.titleComponentName ? Components[currentRoute.titleComponentName] : null;
    const titleString = currentRoute?.title || currentRoute?.subtitle;
    
    return (
      <div>
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

          <link rel='canonical' href={url}/>
          <link name='favicon' rel='shortcut icon' href={getSetting('faviconUrl', '/img/favicon.ico')}/>

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

      </div>
    );
}

HeadTags.propTypes = {
  url: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
};

registerComponent('HeadTags', HeadTags, withApollo);

export default HeadTags;
