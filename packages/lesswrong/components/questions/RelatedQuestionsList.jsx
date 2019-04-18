import { Components, registerComponent, withMulti, Utils } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { RelatedPostRels } from '../../lib/collections/relatedPostRels';

import { FormattedMessage } from 'meteor/vulcan:i18n';
import classNames from 'classnames';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles'

const Error = ({error}) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</div>;

const styles = theme => ({
  root: {
    width: 650 + (theme.spacing.unit*4),
  },
  itemIsLoading: {
    opacity: .4,
  },
  loading: {
    '&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  },
  loadMore: {
    flexGrow: 1,
    textAlign: "left",
    '&:after': {
      content: "''",
      marginLeft: 0,
      marginRight: 0,
    }
  }
})

const RelatedQuestionsList = ({ children, results, loading, count, totalCount, loadMore, networkStatus, paginationTerms, currentUser, dimWhenLoading, error, classes, terms, showLoading = true, showLoadMore = true, showNoResults = true}) => {

  const { Loading, RelatedQuestionsItem, LoadMore, PostsNoResults, SectionFooter, SectionTitle } = Components

  if (!results && loading) return <Loading />

  const limit = (paginationTerms && paginationTerms.limit) || 10

  // We don't actually know if there are more posts here,
  // but if this condition fails to meet we know that there definitely are no more posts
  const maybeMorePosts = !!(results && results.length && (results.length >= limit))

  return (
    <div className={classNames(classes.root, {[classes.itemIsLoading]: loading && dimWhenLoading})}>
      {error && <Error error={Utils.decodeIntlError(error)} />}
      {loading && showLoading && dimWhenLoading && <Loading />}
      {results && !results.length && showNoResults && <PostsNoResults />}
      
      {results && <SectionTitle title={`${results.length} Related Questions`} />}

      {results && results.map((rel, i) => {
        const post = rel.parentPost._id === terms.postId ? rel.childPost : rel.parentPost
        return <RelatedQuestionsItem key={rel.childPost._id} post={post} currentUser={currentUser} terms={terms} index={i}/> 
      })}
      <SectionFooter>
        {(showLoadMore) &&
          <div className={classes.loadMore}>
            <LoadMore
              loadMore={loadMore}
              disabled={!maybeMorePosts}
              count={count}
              totalCount={totalCount}
            />
            { !dimWhenLoading && showLoading && loading && <Loading />}
          </div>
        }
        { children }
      </SectionFooter>
    </div>
  )
}

RelatedQuestionsList.propTypes = {
  results: PropTypes.array,
  terms: PropTypes.object,
  loading: PropTypes.bool,
  count: PropTypes.number,
  totalCount: PropTypes.number,
  loadMore: PropTypes.func,
  dimWhenLoading: PropTypes.bool,
  showLoading: PropTypes.bool,
  showLoadMore: PropTypes.bool,
  showNoResults:  PropTypes.bool,
};

const options = {
  collection: RelatedPostRels,
  queryName: 'childPostRels',
  fragmentName: 'ChildRelatedPostRelList',
  enableTotal: false,
  enableCache: true,
  fetchPolicy: 'cache-and-network',
  ssr: true
};

registerComponent('RelatedQuestionsList', RelatedQuestionsList, withUser, [withMulti, options], withStyles(styles, {name:"RelatedQuestionsList"}));
