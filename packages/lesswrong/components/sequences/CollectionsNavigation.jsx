import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter, Link } from 'react-router';
import withGlobalKeydown from '../common/withGlobalKeydown';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  title: {
    display: 'inline-block',
    fontSize: 22,
    verticalAlign: '-webkit-baseline-middle',
    fontVariant: 'small-caps',
    lineHeight: '24px',
    color: 'rgba(0,0,0,0.5)',
    marginTop: -10,
  },
  root: {
    marginLeft:-20
  }
})

class CollectionsNavigation extends PureComponent
{
  componentDidMount() {
    this.props.addKeydownListener(this.handleKey);
  }
  
  handleKey = (ev) => {
    const { router, prevPostUrl, nextPostUrl } = this.props;
    // Only if Shift and no other modifiers
    if (ev.shiftKey && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      // Check the targe of the event; we don't want to navigate if you're
      // trying to use Shift+Left/Right to move the cursor inside eg a comment
      // box. Apply the hotkey if the target is either document.body (nothing
      // selected) or is an <a> tag (a spurious selection because you opened
      // a link in a new tab, usually).
      if (ev.target === document.body || (ev.target && ev.target.tagName === 'A')) {
        if (ev.keyCode == 37) { // Left
          if (prevPostUrl)
            router.push(prevPostUrl);
        } else if (ev.keyCode == 39) { // Right
          if (nextPostUrl)
            router.push(nextPostUrl);
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
      classes,
      
      // Two different ways of identifying the prev/next post for SequencesNavigation,
      // depending on whether this is a collection or a sequence.
      nextPostId, prevPostId,
      nextPostSlug, prevPostSlug,
    } = this.props;
    
    return (
      <div className={classes.root}>
        {loading ? <Components.Loading/> : <React.Fragment>
          {prevPostUrl
            ? <Components.SequencesNavigationLink
                documentUrl={prevPostUrl}
                direction="left"
                documentId={prevPostId}
                slug={prevPostSlug} />
            : <Components.SequencesNavigationLinkDisabled
                direction="left" />}
    
          <div className={classes.title}>
            {title ? <Link to={ titleUrl }>{ title }</Link> : <Components.Loading/>}
          </div>
    
          {nextPostUrl
            ? <Components.SequencesNavigationLink
                documentUrl={nextPostUrl}
                direction="right"
                documentId={nextPostId}
                slug={nextPostSlug} />
            : <Components.SequencesNavigationLinkDisabled
                direction="right" />}
        </React.Fragment>}
      </div>
    )
  }
}

registerComponent('CollectionsNavigation', CollectionsNavigation, withRouter, withGlobalKeydown, withStyles(styles, {name: "CollectionsNavigation"}));
