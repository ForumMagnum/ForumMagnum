import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { decodeIntlError } from '../../lib/vulcan-lib/utils';
import classNames from 'classnames';
import { PostsListConfig, usePostsList } from './usePostsList';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import FormattedMessage from '../../lib/vulcan-i18n/message';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LoadMore from "../common/LoadMore";
import PostsNoResults from "./PostsNoResults";
import SectionFooter from "../common/SectionFooter";
import PostsItem from "./PostsItem";
import PostsLoading from "./PostsLoading";
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { HideIfRepeated } from './HideRepeatedPostsContext';

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

const PostsList2 = (props: PostsList2Props & {noSuspenseBoundary?: boolean}) => {
  if (props.noSuspenseBoundary) {
    return <PostsListLoaded {...props}/>
  } else {
    return <SuspenseWrapper name="PostsList2" fallback={
      <PostsLoading
        placeholderCount={props.placeholderCount ?? props.terms?.limit ?? 1}
        showFinalBottomBorder={props.showFinalBottomBorder}
        viewType={"list"}
        loadMore={props.alwaysShowLoadMore}
      />
    }>
      <PostsListLoaded {...props}/>
    </SuspenseWrapper>
  }
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
    repeatedPostsPrecedence,
  } = usePostsList(props);
  const classes = useStyles(styles);

  if (!orderedResults && loading) {
    return (
      <PostsLoading
        placeholderCount={placeholderCount || limit}
        showFinalBottomBorder={showFinalBottomBorder}
        viewType={viewType}
        loadMore={showLoadMore}
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
            loadMore={showLoadMore}
          />
        }
        {orderedResults && !orderedResults.length && <PostsNoResults/>}

        <AnalyticsContext viewType={viewType}>
          <div className={classNames(
            boxShadow && classes.postsBoxShadow,
            showPlacement && classes.postsGrid,
          )}>
            {itemProps?.map((props) => <React.Fragment key={props.post._id}>
              <HideIfRepeated precedence={repeatedPostsPrecedence} postId={props.post._id}>
                {showPlacement && props.index !== undefined && <div className={classes.placement}>
                  #{props.index + 1}
                </div>}
                <PostsItem  {...props} />
              </HideIfRepeated>
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

export default registerComponent('PostsList2', PostsList2, {
  areEqual: {
    terms: "deep",
  },
});


