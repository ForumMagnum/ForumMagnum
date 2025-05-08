import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { taggingNamePluralCapitalSetting } from '../../lib/instanceSettings';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { LoadMore } from "../common/LoadMore";
import { TagsListItem } from "./TagsListItem";
import { FormatDate } from "../common/FormatDate";
import { MetaInfo } from "../common/MetaInfo";
import { UsersNameDisplay } from "../users/UsersNameDisplay";

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

const NewTagsListInner = ({classes, showHeaders = true}: {
  classes: ClassesType<typeof styles>,
  showHeaders?: boolean
}) => {
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

export const NewTagsList = registerComponent("NewTagsList", NewTagsListInner, {styles});

declare global {
  interface ComponentTypes {
    NewTagsList: typeof NewTagsList
  }
}

