import React, { useCallback, useMemo } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { defaultPostsLayout, PostsLayout, SettingsOption } from '../../lib/collections/posts/dropdownOptions';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';

const styles = (theme: ThemeType): JssStyles => ({
  optionIcon: {
    verticalAlign: "middle",
    position: "relative",
    color: theme.palette.grey[600],
    width: 19,
    height: 19,
  },
  optionIconInline: {
    verticalAlign: "middle",
    position: "relative",
    color: theme.palette.grey[600],
    width: 17,
    height: 17,
    marginLeft: 2,
    marginRight: 8,
  },
})

const PostsLayoutDropdown = ({classes, value=defaultPostsLayout, queryParam="layout"}:{
  classes: ClassesType,
  value?: PostsLayout
  queryParam?: string,
}) => {
  const { ForumIcon, ForumDropdown } = Components;
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  
  const POSTS_LAYOUT_OPTIONS: Record<PostsLayout, SettingsOption> = useMemo(() => ({
    card: {
      label: (
        <>
          <ForumIcon className={classes.optionIconInline} icon="Card" />
          <span>Card view</span>
        </>
      ),
      shortLabel: <ForumIcon className={classes.optionIcon} icon="Card" />,
    },
    list: {
      label: (
        <>
          <ForumIcon className={classes.optionIconInline} icon="List" />
          <span>List view</span>
        </>
      ),
      shortLabel: <ForumIcon className={classes.optionIcon} icon="List" />,
    },
  }), [ForumIcon, classes.optionIcon, classes.optionIconInline]);

  const onSelect = useCallback((value: PostsLayout) => {
    if (!currentUser) return;

    // Persist the setting for next time they visit
    void updateCurrentUser({
      subforumPreferredLayout: value,
    });
  }, [currentUser, updateCurrentUser]);

  return <ForumDropdown value={value} options={POSTS_LAYOUT_OPTIONS} queryParam={queryParam} onSelect={onSelect} />;
}

const PostsLayoutDropdownComponent = registerComponent('PostsLayoutDropdown', PostsLayoutDropdown, {styles});

declare global {
  interface ComponentTypes {
    PostsLayoutDropdown: typeof PostsLayoutDropdownComponent
  }
}
