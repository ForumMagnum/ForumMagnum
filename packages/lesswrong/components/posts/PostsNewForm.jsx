import { Components, registerComponent, getFragment, withMessages, getSetting } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import withUser from '../common/withUser'
import { withStyles } from '@material-ui/core/styles';
import { useLocation, useNavigation } from '../../lib/routeUtil.js';
import NoSsr from '@material-ui/core/NoSsr';

const styles = theme => ({
  formSubmit: {
    display: "flex",
    flexWrap: "wrap",
  }
})

const PostsNewForm = ({currentUser, flash, classes}) => {
  const { query } = useLocation();
  const { history } = useNavigation();
  
  const { PostSubmit, WrappedSmartForm, WrappedLoginForm, SubmitToFrontpageCheckbox } = Components
  const mapsAPIKey = getSetting('googleMaps.apiKey', null);
  const userHasModerationGuidelines = currentUser && currentUser.moderationGuidelines && currentUser.moderationGuidelines.originalContents
  const af = getSetting('forumType') === 'AlignmentForum'
  const prefilledProps = {
    isEvent: query && !!query.eventForm,
    types: query && query.ssc ? ['SSC'] : [],
    meta: query && !!query.meta,
    af: af || (query && !!query.af),
    groupId: query && query.groupId,
    moderationStyle: currentUser && currentUser.moderationStyle,
    moderationGuidelines: userHasModerationGuidelines ? currentUser.moderationGuidelines : undefined
  }
  const eventForm = query && query.eventForm

  if (!Posts.options.mutations.new.check(currentUser)) {
    return (<WrappedLoginForm />);
  }
  const NewPostsSubmit = (props) => {
    return <div className={classes.formSubmit}>
      {!eventForm && <SubmitToFrontpageCheckbox {...props} />}
      <PostSubmit {...props} />
    </div>
  }

  return (
    <div className="posts-new-form">
      {prefilledProps.isEvent && <Helmet><script src={`https://maps.googleapis.com/maps/api/js?key=${mapsAPIKey}&libraries=places`}/></Helmet>}
      <NoSsr>
        <WrappedSmartForm
          collection={Posts}
          mutationFragment={getFragment('PostsPage')}
          prefilledProps={prefilledProps}
          successCallback={post => {
            history.push({pathname: Posts.getPageUrl(post)});
            flash({ id: 'posts.created_message', properties: { title: post.title }, type: 'success'});
          }}
          eventForm={eventForm}
          repeatErrors
          formComponents={{
            FormSubmit: NewPostsSubmit,
          }}
        />
      </NoSsr>
    </div>
  );
}


PostsNewForm.propTypes = {
  closeModal: PropTypes.func,
  flash: PropTypes.func,
}

registerComponent('PostsNewForm', PostsNewForm, withMessages, withUser, withStyles(styles, { name: "PostsNewForm" }));
