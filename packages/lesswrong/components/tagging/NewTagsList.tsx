import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
    padding: 12,
    paddingTop: 2,
    boxShadow: theme.palette.boxShadow.default,
  },
  date: {
    width: 30,
    marginRight: 8
  },
  user: {
    marginRight: 12,
  },
  postCount: {
    marginRight: 12,
  },
  loadMore: {
    marginLeft: 2,
    marginTop: 6
  }
})

const NewTagsList = ({classes, showHeaders = true}: {
  classes: ClassesType<typeof styles>,
  showHeaders?: boolean
}) => {
  const { LoadMore, TagsListItem, FormatDate, MetaInfo, UsersNameDisplay } = Components

  const { results, loadMoreProps } = useMulti({
    terms: {view:"newTags", limit: 4 },
    collectionName: "Tags",
    fragmentName: "SunshineTagFragment",
    enableTotal: true,
    itemsPerPage: 20,
  });

  return <div className={classes.root}>
    {showHeaders && <h2>New {taggingNamePluralCapitalSetting.get()}</h2>}
    <table>
      <tbody>
        {results?.map(tag => <tr key={tag._id}>
          {tag.user && <td className={classes.user}>
            <MetaInfo>
              <UsersNameDisplay user={tag.user}/>
            </MetaInfo>
          </td>}
          <td>
            <TagsListItem tag={tag}/>
          </td>
          <td>
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

