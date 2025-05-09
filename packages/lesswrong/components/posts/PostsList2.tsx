import React, { Suspense } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { decodeIntlError } from '../../lib/vulcan-lib/utils';
import classNames from 'classnames';
import { PostsListConfig, usePostsList } from './usePostsList';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import FormattedMessage from '../../lib/vulcan-i18n/message';
import { defineStyles, useStyles } from '../hooks/useStyles';

const Error = ({error}: any) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</div>;

const styles = defineStyles("PostsList2", (theme: ThemeType) => ({
  itemIsLoading: {
    opacity: .4,
  },
  postsBoxShadow: {
    boxShadow: theme.palette.boxShadow.default,
  },
  postsGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, min-content) minmax(10px, 1fr)',
    columnGap: '20px',
  },
  placement: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '1px',
  },
}));

type PostsList2Props = PostsListConfig;

const PostsList2 = (props: PostsList2Props) => {
  const { PostsLoading } = Components;
  return <Suspense fallback={
    <PostsLoading
      placeholderCount={props.placeholderCount ?? props.terms?.limit ?? 1}
      showFinalBottomBorder={props.showFinalBottomBorder}
      viewType={"list"}
    />
  }>
    <PostsListLoaded {...props}/>
  </Suspense>
}

/** A list of posts, defined by a query that returns them. */
const PostsListLoaded = ({...props}: PostsList2Props) => {
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
    limit,
    placeholderCount,
    showFinalBottomBorder,
    viewType,
    showPlacement,
    header,
  } = usePostsList(props);
  const classes = useStyles(styles);

  const { LoadMore, PostsNoResults, SectionFooter, PostsItem, PostsLoading } = Components;

  if (!orderedResults && loading) {
    return (
      <PostsLoading
        placeholderCount={placeholderCount || limit}
        showFinalBottomBorder={showFinalBottomBorder}
        viewType={viewType}
      />
    );
  }

  if (!orderedResults?.length && !showNoResults) {
    return null
  }

  return (
    <>
      {header}
      <div className={classNames({[classes.itemIsLoading]: loading && dimWhenLoading})}>
        {error && <Error error={decodeIntlError(error)}/>}
        {loading && showLoading && (topLoading || dimWhenLoading) &&
          <PostsLoading
            placeholderCount={placeholderCount || limit}
            viewType={viewType}
          />
        }
        {orderedResults && !orderedResults.length && <PostsNoResults/>}

      <AnalyticsContext viewType={viewType}>
        <div className={classNames(
          boxShadow && classes.postsBoxShadow,
          showPlacement && classes.postsGrid,
        )}>
          {itemProps?.map((props) => <React.Fragment key={props.post._id}>
            {showPlacement && props.index !== undefined && <div className={classes.placement}>
              #{props.index + 1}
            </div>}
            <PostsItem  {...props} />
          </React.Fragment>)}
        </div>
      </AnalyticsContext>

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
          {children}
        </SectionFooter>}
      </div>
    </>
  )
}

const PostsList2Component = registerComponent('PostsList2', PostsList2, {
  areEqual: {
    terms: "deep",
  },
});

declare global {
  interface ComponentTypes {
    PostsList2: typeof PostsList2Component
  }
}
