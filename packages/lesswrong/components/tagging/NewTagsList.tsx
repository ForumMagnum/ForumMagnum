import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Tags from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper'
import Users from '../../lib/collections/users/collection';

const styles = theme => ({
  root: {
    ...theme.typography.commentStyle,
    marginBottom: 24,
    background: "white",
    padding: 12,
    paddingTop: 4,
    boxShadow: theme.boxShadow
  },
  date: {
    width: 30,
    marginRight: 8
  },
  loadMore: {
    color: theme.palette.primary.main,
    fontSize: "1.1rem",
    marginLeft: 2,
    marginTop: 6
  }
})

const NewTagsList = ({classes}:{
  classes: ClassesType
}) => {
  const { LoadMore, FooterTag, FormatDate, MetaInfo, UsersNameDisplay } = Components

  const { results, loadMoreProps } = useMulti({
    terms: {view:"newTags", limit: 5 },
    collection: Tags,
    fragmentName: "SunshineTagFragment",
    enableTotal: true,
    ssr: true,
  });

  return <div className={classes.root}>
    <h2>New Tags</h2>
    <table>
      <tbody>
        {results?.map(tag => <tr key={tag._id}>
          <Link to={Users.getProfileUrl(tag.user)} className={classes.user}>
            <MetaInfo>
              <UsersNameDisplay user={tag.user}/>
            </MetaInfo>
          </Link>
          <td className={classes.tag}>
            <FooterTag tag={tag} hideScore smallText/>
          </td>
          <td className={classes.postCount}>
            <MetaInfo>{tag.postCount} posts</MetaInfo>
          </td>
          <td className={classes.date}>
            <MetaInfo>
              <FormatDate date={tag.createdAt}/>
            </MetaInfo>
          </td>
        </tr>)}
      </tbody>
    </table>
    <div className={classes.loadMore}>
      <LoadMore {...loadMoreProps}/>
    </div>
  </div>
}

const NewTagsListComponent = registerComponent("NewTagsList", NewTagsList, {styles});

declare global {
  interface ComponentTypes {
    NewTagsList: typeof NewTagsListComponent
  }
}

