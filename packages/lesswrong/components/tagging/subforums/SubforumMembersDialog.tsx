import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { DialogContent } from "@/components/widgets/DialogContent";
import LWDialog from "../../common/LWDialog";
import SubforumSubscribeSection from "./SubforumSubscribeSection";
import SubforumMember from "./SubforumMember";
import Loading from "../../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const UsersProfileMultiQuery = gql(`
  query multiUserSubforumMembersDialogQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 14,
    padding: '0 24px',
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
  }
})

const SubforumMembersDialog = ({classes, onClose, tag}: {
  classes: ClassesType<typeof styles>,
  onClose: () => void,
  tag: TagSubforumFragment,
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
    <LWDialog open={true} onClose={onClose}>
      <h2 className={classes.titleRow}>
        <div className={classes.title}>Members{members ? ` (${members.length})` : ''}</div>
        <SubforumSubscribeSection tag={tag} className={classes.joinBtn} />
      </h2>
      <DialogContent>
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
      </DialogContent>
    </LWDialog>
  )
}

export default registerComponent('SubforumMembersDialog', SubforumMembersDialog, { styles });


