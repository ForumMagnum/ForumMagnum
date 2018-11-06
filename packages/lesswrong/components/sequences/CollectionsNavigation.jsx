import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import React from 'react';
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
    position: 'absolute',
    top: -45,
    left: -20,
  }
})

const CollectionsNavigation = ({
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
}) => {

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
              documentId={nextPostUrl && nextPostId}
              slug={nextPostUrl && nextPostSlug} />
          : <Components.SequencesNavigationLinkDisabled
              direction="right" />}
      </React.Fragment>}
    </div>
  )
}

registerComponent('CollectionsNavigation', CollectionsNavigation, withStyles(styles, {name: "CollectionsNavigation"}));
