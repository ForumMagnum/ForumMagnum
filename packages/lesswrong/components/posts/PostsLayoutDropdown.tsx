import React, { useCallback, useMemo } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defaultPostsLayout, PostsLayout, SettingsOption } from '../../lib/collections/posts/dropdownOptions';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import classNames from 'classnames';
import { ForumIcon } from "../common/ForumIcon";
import { ForumDropdown } from "../common/ForumDropdown";

const styles = (theme: ThemeType) => ({
  optionIcon: {
    verticalAlign: "middle",
    position: "relative",
    width: 18,
    height: 18,
  },
  optionIconInline: {
    marginLeft: 2,
    marginRight: 6,
    top: -1,
    width: 16,
    height: 16,
  },
})

const PostsLayoutDropdownInner = ({classes, value=defaultPostsLayout, queryParam="layout"}: {
  classes: ClassesType<typeof styles>,
  value?: PostsLayout
  queryParam?: string,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  
  const POSTS_LAYOUT_OPTIONS: Record<PostsLayout, SettingsOption> = useMemo(() => ({
    card: {
      label: (
        <>
          <ForumIcon className={classNames(classes.optionIcon, classes.optionIconInline)} icon="Card" />
          <span>Card view</span>
        </>
      ),
      shortLabel: <ForumIcon className={classes.optionIcon} icon="Card" />,
    },
    list: {
      label: (
        <>
          <ForumIcon className={classNames(classes.optionIcon, classes.optionIconInline)} icon="List" />
          <span>List view</span>
        </>
      ),
      shortLabel: <ForumIcon className={classes.optionIcon} icon="List" />,
    },
  }), [classes.optionIcon, classes.optionIconInline]);

  const onSelect = useCallback((value: PostsLayout) => {
    if (!currentUser) return;

    // Persist the setting for next time they visit
    void updateCurrentUser({
      subforumPreferredLayout: value,
    });
  }, [currentUser, updateCurrentUser]);

  return <ForumDropdown value={value} options={POSTS_LAYOUT_OPTIONS} queryParam={queryParam} onSelect={onSelect} />;
}

export const PostsLayoutDropdown = registerComponent('PostsLayoutDropdown', PostsLayoutDropdownInner, {styles});


