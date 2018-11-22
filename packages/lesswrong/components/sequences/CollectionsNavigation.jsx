import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter, Link } from 'react-router';
import React, { PureComponent } from 'react';

class CollectionsNavigation extends PureComponent
{
  componentDidMount() {
    if (!Meteor.isServer && document) {
      document.addEventListener("keydown", this.handleKey);
    }
  }
  
  componentWillUnmount() {
    if (!Meteor.isServer && document) {
      document.removeEventListener("keydown", this.handleKey);
    }
  }
  
  handleKey = (ev) => {
    // Only if Shift and no other modifiers
    if (ev.shiftKey && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      // Check the targe of the event; we don't want to navigate if you're
      // trying to use Shift+Left/Right to move the cursor inside eg a comment
      // box. Apply the hotkey if the target is either document.body (nothing
      // selected) or is an <a> tag (a spurious selection because you opened
      // a link in a new tab, usually).
      if (ev.target === document.body || (ev.target && ev.target.tagName === 'A')) {
        if (ev.keyCode == 37) { // Left
          this.props.router.push(this.props.prevPostUrl);
        } else if (ev.keyCode == 39) { // Right
          this.props.router.push(this.props.nextPostUrl);
        }
      }
    }
  }
  
  render() {
    const {
      nextPostUrl,
      prevPostUrl,
      title,
      titleUrl,
      loading,
      
      // Two different ways of identifying the prev/next post for SequencesNavigation,
      // depending on whether this is a collection or a sequence.
      nextPostId, prevPostId,
      nextPostSlug, prevPostSlug,
    } = this.props;
    
    return (
      <div className="sequences-navigation-top">
        {loading ? <Components.Loading/> : <React.Fragment>
          {prevPostUrl
            ? <Components.SequencesNavigationLink
                documentUrl={prevPostUrl}
                direction="left"
                documentId={prevPostId}
                slug={prevPostSlug} />
            : <Components.SequencesNavigationLinkDisabled
                direction="left" />}
    
          <div className="sequences-navigation-title">
            {title ? <Link to={ titleUrl }>{ title }</Link> : <Components.Loading/>}
          </div>
    
          {nextPostUrl
            ? <Components.SequencesNavigationLink
                documentUrl={nextPostUrl}
                direction="right"
                documentId={nextPostUrl && nextPostId}
                slug={nextPostUrl && nextPostSlug} />
            : <Components.SequencesNavigationLinkDisabled
                direction="right" />}
        </React.Fragment>}
      </div>
    )
  }
}

registerComponent('CollectionsNavigation', CollectionsNavigation, withRouter);
