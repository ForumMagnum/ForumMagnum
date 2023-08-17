import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { decodeIntlError } from '../../lib/vulcan-lib/utils';
import { FormattedMessage } from '../../lib/vulcan-i18n';
import classNames from 'classnames';
import { PostsListConfig, usePostsList } from './usePostsList';

const Error = ({error}: any) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</div>;

const styles = (theme: ThemeType): JssStyles => ({
  itemIsLoading: {
    opacity: .4,
  },
  posts: {
    boxShadow: theme.palette.boxShadow.default,
  },
});

type PostsList2Props = PostsListConfig & {classes: ClassesType};

/** A list of posts, defined by a query that returns them. */
const PostsList2 = ({classes, ...props}: PostsList2Props) => {
  const {
    children,
    showNoResults,
    showLoadMore,
    showLoading,
    dimWhenLoading,
    loading,
    topLoading,
    boxShadow,
    error,
    loadMore,
    loadMoreProps,
    maybeMorePosts,
    orderedResults,
    itemProps,
  }= usePostsList(props);

  const { Loading, LoadMore, PostsNoResults, SectionFooter, PostsItem } = Components;

  if (!orderedResults && loading) {
    return <Loading />
  }

  if (!orderedResults?.length && !showNoResults) {
    return null
  }

  return (
    <div className={classNames({[classes.itemIsLoading]: loading && dimWhenLoading})}>
      {error && <Error error={decodeIntlError(error)} />}
      {loading && showLoading && (topLoading || dimWhenLoading) && <Loading />}
      {orderedResults && !orderedResults.length && <PostsNoResults />}

      <div className={boxShadow ? classes.posts : null}>
        {itemProps?.map((props) => <PostsItem key={props.post._id} {...props} />)}
      </div>
      {showLoadMore && <SectionFooter>
        <LoadMore
          {...loadMoreProps}
          loading={loading}
          loadMore={loadMore}
          hideLoading={dimWhenLoading || !showLoading}
          // It's important to use hidden here rather than not rendering the component,
          // because LoadMore has an "isFirstRender" check that prevents it from showing loading dots
          // on the first render. Not rendering resets this
          hidden={!maybeMorePosts && !loading}
          sectionFooterStyles
        />
        { children }
      </SectionFooter>}
    </div>
  )
}

const PostsList2Component = registerComponent('PostsList2', PostsList2, {
  styles,
  areEqual: {
    terms: "deep",
  },
});

declare global {
  interface ComponentTypes {
    PostsList2: typeof PostsList2Component
  }
}
