import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { registerComponent, Utils, getSetting, Head } from 'meteor/vulcan:lib';
import { compose } from 'react-apollo';
import { withLocation } from '../../lib/routeUtil';

class HeadTags extends PureComponent {

  render() {

    const url = this.props.url || Utils.getSiteUrl();
    const appTitle = getSetting('forumSettings.tabTitle', 'LessWrong 2.0');
    const title = this.props.title ? `${this.props.title} - ${appTitle}` : appTitle;
    const description = this.props.description || getSetting('tagline') || getSetting('description');
    
    return (
      <div>
        <Helmet key={this.props.location.pathname}>

          <title>{title}</title>

          <meta charSet='utf-8'/>
          <meta name='description' content={description}/>
          <meta name='viewport' content='width=device-width, initial-scale=1'/>

          {/* facebook */}
          <meta property='og:type' content='article'/>
          <meta property='og:url' content={url}/>
          {this.props.image && <meta property='og:image' content={this.props.image}/>}
          <meta property='og:title' content={title}/>
          <meta property='og:description' content={description}/>

          {/* twitter */}
          <meta name='twitter:card' content='summary'/>
          {this.props.image && <meta name='twitter:image:src' content={this.props.image}/>}
          <meta name='twitter:title' content={title}/>
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
}

HeadTags.propTypes = {
  url: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
};

registerComponent('HeadTags', HeadTags, withLocation);

export default HeadTags;
