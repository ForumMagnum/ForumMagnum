import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames';
import SubforumSubscribeSection from "./SubforumSubscribeSection";
import SubforumMember from "./SubforumMember";
import Loading from "../../vulcan-core/Loading";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const UsersProfileMultiQuery = gql(`
  query multiUserSidebarMembersBoxQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 14,
    padding: '12px 16px',
    margin: 0,
  },
  title: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 20,
    lineHeight: '26px',
    fontWeight: 400,
    textTransform: 'capitalize'
  },
  joinBtn: {
    '& button': {
      minHeight: 0,
      fontSize: 12,
      padding: 6
    }
  },
  user: {
    marginBottom: 20
  },
  scrollableList: {
    paddingLeft: 16,
    paddingRight: 16,
    maxHeight: 450,
    overflowY: 'scroll',
    position: 'relative',
  },
  gradientWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    paddingRight: 15, // clear the scrollbar
    width: '100%',
    height: 40,
    pointerEvents: 'none',
  },
  gradient: {
    width: '100%',
    height: '100%',
    background: `linear-gradient(to top, ${theme.palette.grey[0]}, transparent)`,
  },
  gradientBuffer: {
    height: 40,
  },
})

const SidebarMembersBox = ({tag, className, classes}: {
  tag: TagSubforumFragment,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { data, loading } = useQuery(UsersProfileMultiQuery, {
    variables: {
      selector: { tagCommunityMembers: { profileTagId: tag?._id } },
      limit: 100,
      enableTotal: false,
    },
    skip: !tag,
    notifyOnNetworkStatusChange: true,
  });

  const members = data?.users?.results;
  
  const organizers: UsersProfile[] = []
  const otherMembers: UsersProfile[] = []
  members?.forEach(member => {
    if (tag.subforumModeratorIds?.includes(member._id)) {
      organizers.push(member)
    } else {
      otherMembers.push(member)
    }
  })
  return (
    <div className={classNames(className, classes.root)}>
      <h2 className={classes.titleRow}>
        <div className={classes.title}>Members{members ? ` (${members.length})` : ''}</div>
        <SubforumSubscribeSection tag={tag} className={classes.joinBtn} />
      </h2>
      <div className={classes.scrollableList}>
        {loading && <Loading />}
        {organizers?.map(user => {
          return <div key={user._id} className={classes.user}>
            <SubforumMember user={user} isOrganizer />
          </div>
        })}
        {otherMembers?.map(user => {
          return <div key={user._id} className={classes.user}>
            <SubforumMember user={user} />
          </div>
        })}
        <div className={classes.gradientBuffer} />
      </div>
      <div className={classes.gradientWrapper}>
        <div className={classes.gradient} />
      </div>
    </div>
  )
}

export default registerComponent('SidebarMembersBox', SidebarMembersBox, { styles });


