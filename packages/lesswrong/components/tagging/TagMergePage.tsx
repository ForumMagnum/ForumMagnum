import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { userIsAdminOrMod } from "../../lib/vulcan-users/permissions";
import { useCurrentUser } from "../common/withUser";
import { taggingNameCapitalSetting, taggingNameSetting } from "../../lib/instanceSettings";
import Checkbox from "@material-ui/core/Checkbox";
import { useSingle } from "../../lib/crud/withSingle";
import { Link } from "../../lib/reactRouterWrapper";
import { tagGetUrl } from "../../lib/collections/tags/helpers";
import { gql, useMutation } from "@apollo/client";
import { useMessages } from "../common/withMessages";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
  },
  title: {
    marginBottom: 8,
  },
  section: {
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 12,
    borderRadius: theme.borderRadius.default,
  },
  selectTagRow: {
    display: "flex",
    minHeight: 280, // Stop layout shift when there is nothing selected
    "& > *": {
      // This targets all direct children of the element with class `selectTagRow`
      flex: 1,
    },
  },
  tagSection: {},
  tagSearch: {
    position: "relative",
    marginBottom: 8,
  },
  tagSummary: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  checkboxRow: {
    marginRight: 12,
    marginTop: 5,
    display: "flex",
    alignItems: "center",
  },
  checkbox: {
    width: 36,
    height: 0,
  },
  submitRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 8,
  },
});

const TagMergePage = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { TagsSearchAutoComplete, Typography, SingleColumnSection, Loading, EAButton, LWTooltip } = Components;

  const currentUser = useCurrentUser();
  const { flash } = useMessages();

  const [sourceTagId, setSourceTagId] = useState<string | null>(null);
  const [targetTagId, setTargetTagId] = useState<string | null>(null);
  const [transferPosts, setTransferPosts] = useState<boolean>(true);
  const [removePosts, setRemovePosts] = useState<boolean>(true);
  const [transferSubtags, setTransferSubtags] = useState<boolean>(true);
  const [redirectSource, setDeleteSource] = useState<boolean>(false);

  const [mergeTags, {loading: mutationLoading}] = useMutation(gql`
    mutation mergeTags(
      $sourceTagId: String!
      $targetTagId: String!
      $transferSubtags: Boolean!
      $redirectSource: Boolean!
    ) {
      mergeTags(
        sourceTagId: $sourceTagId
        targetTagId: $targetTagId
        transferSubtags: $transferSubtags
        redirectSource: $redirectSource
      )
    }
  `);

  const {
    document: sourceTag,
    loading: sourceTagLoading,
    refetch: refetchSource,
  } = useSingle({
    documentId: sourceTagId ?? "",
    collectionName: "Tags",
    fragmentName: "TagFragment",
    fetchPolicy: "network-only",
    skip: !sourceTagId,
  });

  const {
    document: targetTag,
    loading: targetTagLoading,
    refetch: refetchTarget,
  } = useSingle({
    documentId: targetTagId ?? "",
    collectionName: "Tags",
    fragmentName: "TagFragment",
    fetchPolicy: "network-only",
    skip: !targetTagId,
  });

  const onSubmit = useCallback(async () => {
    try {
      await mergeTags({ variables: { sourceTagId, targetTagId, transferSubtags, redirectSource } });

      void refetchSource();
      void refetchTarget();
    } catch (error) {
      flash({ messageString: error.message });
    }
  }, [mergeTags, sourceTagId, targetTagId, transferSubtags, redirectSource, refetchSource, refetchTarget, flash]);

  if (!userIsAdminOrMod(currentUser)) {
    return null;
  }

  return (
    <SingleColumnSection className={classes.root}>
      <Typography className={classes.title} variant="title">
        {taggingNameCapitalSetting.get()} merging tool
      </Typography>
      <div className={classes.section}>
        <div className={classes.selectTagRow}>
          <div className={classes.tagSection}>
            <div className={classes.tagSearch}>
              <TagsSearchAutoComplete clickAction={setSourceTagId} placeholder={`Source ${taggingNameSetting.get()}`} />
            </div>
            {sourceTag ? (
              <div className={classes.tagSummary}>
                <Link to={tagGetUrl(sourceTag)} target="_blank" rel="noopener noreferrer">
                  {sourceTag.name}
                </Link>
                <div>Slug: {sourceTag.slug}</div>
                <div>_id: {sourceTag._id}</div>
                <div>Post count: {sourceTag.postCount}</div>
                <div>Subtag count: {sourceTag.subTags?.length ?? 0}</div>
              </div>
            ) : (
              sourceTagId && sourceTagLoading && <Loading />
            )}
          </div>
          <div className={classes.tagSection}>
            <div className={classes.tagSearch}>
              <TagsSearchAutoComplete clickAction={setTargetTagId} placeholder={`Target ${taggingNameSetting.get()}`} />
            </div>
            {targetTag ? (
              <div className={classes.tagSummary}>
                <Link to={tagGetUrl(targetTag)} target="_blank" rel="noopener noreferrer">
                  {targetTag.name}
                </Link>
                <div>Slug: {targetTag.slug}</div>
                <div>_id: {targetTag._id}</div>
                <div>Post count: {targetTag.postCount}</div>
                <div>Subtag count: {targetTag.subTags?.length ?? 0}</div>
              </div>
            ) : (
              targetTagId && targetTagLoading && <Loading />
            )}
          </div>
        </div>
        <div className={classes.checkboxRow}>
          <LWTooltip title="Disabling this not implemented">
            <Checkbox
              className={classes.checkbox}
              checked={transferPosts}
              onChange={(_, checked) => setTransferPosts(checked)}
              disabled={true}
            />
          </LWTooltip>
          <Typography variant="body2" component="label">
            Transfer posts
          </Typography>
        </div>
        <div className={classes.checkboxRow}>
          <LWTooltip title="Disabling this not implemented">
            <Checkbox
              className={classes.checkbox}
              checked={removePosts}
              onChange={(_, checked) => setRemovePosts(checked)}
              disabled={true}
            />
          </LWTooltip>
          <Typography variant="body2" component="label">
            {`Remove posts from source ${taggingNameSetting.get()}`}
          </Typography>
        </div>
        <div className={classes.checkboxRow}>
          <Checkbox
            className={classes.checkbox}
            checked={transferSubtags}
            onChange={(_, checked) => setTransferSubtags(checked)}
          />
          <Typography variant="body2" component="label">
            Transfer subtags (also removes them from source {taggingNameSetting.get()})
          </Typography>
        </div>
        <div className={classes.checkboxRow}>
          <Checkbox
            className={classes.checkbox}
            checked={redirectSource}
            onChange={(_, checked) => setDeleteSource(checked)}
          />
          <Typography variant="body2" component="label">
            Redirect source topic slug to target (The source {taggingNameSetting.get()} will be soft deleted and have
            "-deleted" added to its slug to avoid colliding with the target. You may want to first merge without this
            checked, and then do this as a final step.)
          </Typography>
        </div>
        <div className={classes.submitRow}>
          {!mutationLoading ? <EAButton onClick={onSubmit}>Submit</EAButton> : <Loading />}
        </div>
      </div>
    </SingleColumnSection>
  );
};

const TagMergePageComponent = registerComponent("TagMergePage", TagMergePage, { styles });

declare global {
  interface ComponentTypes {
    TagMergePage: typeof TagMergePageComponent;
  }
}
