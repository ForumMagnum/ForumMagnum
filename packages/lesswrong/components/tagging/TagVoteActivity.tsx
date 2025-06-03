import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useVote } from '../votes/withVote';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { voteButtonsDisabledForUser } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import FormatDate from "../common/FormatDate";
import OverallVoteButton from "../votes/OverallVoteButton";
import FooterTag from "./FooterTag";
import UsersName from "../users/UsersName";
import TagSmallPostLink from "./TagSmallPostLink";
import SingleColumnSection from "../common/SingleColumnSection";
import LoadMore from "../common/LoadMore";
import NewTagsList from "./NewTagsList";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const TagVotingActivityMultiQuery = gql(`
  query multiVoteTagVoteActivityQuery($selector: VoteSelector, $limit: Int, $enableTotal: Boolean) {
    votes(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagVotingActivity
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  voteRow: {
    ...theme.typography.body2,
    ...theme.typography.smallText,
    color: theme.palette.grey[600]
  },
  headerCell: {
    fontWeight: 700,
    ...theme.typography.body2,
  },
  votingCell: {
    textAlign: "center",
    fontSize: '1.4rem'
  },
  voteButtons: {
    width: 50
  },
  postCell: {
    maxWidth: 316,
    paddingRight: 16
  },
  tagCell: {
    maxWidth: 216,
    paddingRight: 16
  },
  score: {
    fontSize: '1.2rem',
    position: "relative",
    bottom: -1,
    margin: 5
  },
  smallCell: {
    textAlign: "center"
  },
  tagVotingTable: {
    background: theme.palette.panelBackground.default,
    padding: 12,
    paddingTop: 2,
    ...theme.typography.commentStyle,
    boxShadow: theme.palette.boxShadow.default,
  }
})

const TagVoteActivityRow = ({vote, classes}: {
  vote: TagVotingActivity,
  classes: ClassesType<typeof styles>
}) => {
  const voteProps = useVote(vote.tagRel!, "TagRels")
  const currentUser = useCurrentUser();
  if (!vote.tagRel?.post || !vote.tagRel?.tag)
    return null;
  
  const {fail, reason: whyYouCantVote} = voteButtonsDisabledForUser(currentUser);
  const canVote = !fail;
  
  return (
    <tr key={vote._id} className={classes.voteRow}>
      <td><UsersName documentId={vote.userId ?? undefined}/></td>
      <td className={classes.postCell}> <TagSmallPostLink hideMeta post={vote.tagRel?.post}/> </td>
      <td className={classes.tagCell}>
        <FooterTag tag={vote.tagRel?.tag} tagRel={vote.tagRel} hideScore smallText hoverable={true} />
      </td>
      <td className={classes.smallCell}>{vote.power} {vote.isUnvote && <span title="Unvote">(unv.)</span>}</td>
      <td className={classes.smallCell}><FormatDate date={vote.votedAt!}/></td>
      <td className={classes.votingCell}>
        <div className={classes.voteButtons}>
          <OverallVoteButton
            orientation="left"
            color="error"
            upOrDown="Downvote"
            enabled={canVote}
            {...voteProps}
          />
          <span className={classes.score}>
            {voteProps.baseScore}
          </span>
          <OverallVoteButton
            orientation="right"
            color="secondary"
            upOrDown="Upvote"
            enabled={canVote}
            {...voteProps}
          />
        </div>
      </td>
    </tr>
  );
}

const TagVoteActivity = ({classes, showHeaders = true, showNewTags = true, limit = 200, itemsPerPage = 200}: {
  classes: ClassesType<typeof styles>,
  showHeaders?: boolean,
  showNewTags?: boolean,
  limit?: number,
  itemsPerPage?: number
}) => {
  const { data, loadMoreProps } = useQueryWithLoadMore(TagVotingActivityMultiQuery, {
    variables: {
      selector: { tagVotes: {} },
      limit: limit,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
    itemsPerPage,
  });

  const votes = data?.votes?.results;

  return <SingleColumnSection>
    {showNewTags && <NewTagsList />}
    <div className={classes.tagVotingTable}>
      {showHeaders && <h2>{taggingNameCapitalSetting.get()} Voting</h2>}
      <table>
        <tbody>
          <tr>
            <td className={classes.headerCell}> User </td>
            <td className={classes.headerCell}> Post Title </td>
            <td className={classes.headerCell}> {taggingNameCapitalSetting.get()} </td>
            <td className={classes.headerCell}> Pow </td>
            <td className={classes.headerCell}> When </td>
            <td className={classes.headerCell}> Vote </td>
          </tr>
          {votes?.map(vote => <TagVoteActivityRow key={vote._id} vote={vote} classes={classes}/>)}
        </tbody>
      </table>
      <LoadMore {...loadMoreProps} />
    </div>
  </SingleColumnSection>
}


export default registerComponent("TagVoteActivity", TagVoteActivity, {styles});


