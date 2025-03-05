import React, { useMemo, useState } from 'react'
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useTagBySlug } from '../useTag';
import { useLocation } from '../../../lib/routeUtil';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { addDefaultLensToLenses, TagLens } from '@/lib/arbital/useTagLenses';
import keyBy from 'lodash/keyBy';
import { RevealHiddenBlocks, RevealHiddenBlocksContext } from '@/components/editor/conditionalVisibilityBlock/ConditionalVisibilityBlockDisplay';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import { hasWikiLenses } from '@/lib/betas';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import classNames from 'classnames';
import DeferRender from '@/components/common/DeferRender';

export const tagHistoryStyles = defineStyles("TagHistoryPage", (theme: ThemeType) => ({
  title: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
  feed: {
    ...theme.typography.body2,
  },
  settings: {
    background: theme.palette.panelBackground.default,
    padding: 16,
    marginBottom: 32,
    ...theme.typography.body2,
  },
  dropdownSetting: {
    marginBottom: 8,
  },
  checkboxSetting: {
    marginBottom: 8,
  },
  checkbox: {
    padding: 0,
    marginRight: 4,
  },
  label: {
    verticalAlign: "center",
  },
  feedIcon: {
    opacity: 0.5,
    width: 16,
    height: 16,
  },
  commentIcon: {
    marginTop: 6,
  },
}));

export interface TagHistorySettings {
  displayFormat: "expanded"|"dense",
  showEdits: boolean,
  showSummaryEdits: boolean,
  showComments: boolean,
  showTagging: boolean
  showMetadata: boolean,
  lensId: string
}

export const defaultTagHistorySettings: TagHistorySettings = {
  //displayFormat: "dense",
  displayFormat: "expanded",
  showEdits: true,
  showSummaryEdits: true,
  showComments: true,
  showTagging: true,
  showMetadata: true,
  lensId: "all",
};

const TagHistoryPage = () => {
  const classes = useStyles(tagHistoryStyles);
  const { params, query } = useLocation();
  const { slug } = params;
  const focusedUser: string = query.user;
  const { tag, loading: loadingTag, error } = useTagBySlug(slug, "TagHistoryFragment");
  const lenses = useMemo(() => addDefaultLensToLenses(tag, tag?.lensesIncludingDeleted), [tag]);
  const lensesById = keyBy(lenses, l=>l._id);
  const { UsersName, SingleColumnSection, MixedTypeFeed, TagRevisionItem, LensRevisionItem, SummaryRevisionItem, FormatDate, CommentsNode, Loading, LinkToPost, SingleLineFeedEvent, SectionTitle, ForumIcon } = Components;
  const [settings, setSettings] = useState(defaultTagHistorySettings);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const collapseAll = settings.displayFormat === "dense" || !!focusedUser;
  
  if (!tag) {
    if (loadingTag) {
      return <SingleColumnSection>
        <Loading/>
      </SingleColumnSection>
    } else if (error) {
      return <Components.ErrorPage error={error}/>
    } else {
      return <Components.Error404/>
    }
  }
  
  return <SingleColumnSection><DeferRender ssr={false}>
    <SectionTitle title={tag.name} href={tagGetUrl(tag)}>
      <div onClick={ev => setSettingsExpanded(expanded => !expanded)}>
        <Components.SettingsButton label="Settings" />
      </div>
    </SectionTitle>
    
    <TagHistoryFeedSettings
      expanded={settingsExpanded}
      settings={settings}
      setSettings={setSettings}
      lenses={lenses}
    />

    <div className={classes.feed}>
    <RevealHiddenBlocks>
    <MixedTypeFeed
      pageSize={25}
      resolverName="TagHistoryFeed"
      resolverArgs={{
        tagId: "String!",
        options: "JSON",
      }}
      resolverArgsValues={{
        tagId: tag._id,
        options: settings,
      }}
      sortKeyType="Date"
      renderers={{
        tagCreated: {
          fragmentName: "TagHistoryFragment",
          render: (creation: TagHistoryFragment) => <SingleLineFeedEvent icon={<ForumIcon className={classes.feedIcon} icon="Star"/>}>
            Created by <UsersName user={creation.user}/> at <FormatDate date={creation.createdAt}/>
          </SingleLineFeedEvent>,
        },
        tagRevision: {
          fragmentName: "RevisionHistoryEntry",
          render: (revision: RevisionHistoryEntry) => {
            if (!settings.showEdits)
              return null;
            return <div>
              <TagRevisionItem
                tag={tag}
                collapsed={collapseAll && focusedUser!==revision.user?.slug}
                revision={revision}
                headingStyle={"abridged"}
                documentId={tag._id}
                showDiscussionLink={false}
                showIcon={true}
              />
            </div>
          }
        },
        lensRevision: {
          fragmentName: "RevisionHistoryEntry",
          render: (revision: RevisionHistoryEntry) => {
            if (!settings.showEdits)
              return null;
            const lens = lensesById[revision.documentId];
            return <div>
              <LensRevisionItem
                tag={tag}
                collapsed={collapseAll && focusedUser!==revision.user?.slug}
                lens={lens}
                revision={revision}
                showIcon={true}
              />
            </div>
          }
        },
        summaryRevision: {
          fragmentName: "RevisionHistorySummaryEdit",
          render: (revision: RevisionHistorySummaryEdit) => {
            if (!settings.showEdits)
              return null;
            return <div>
              <SummaryRevisionItem
                tag={tag}
                collapsed={collapseAll && focusedUser!==revision.user?.slug}
                revision={revision}
              />
            </div>
          }
        },
        tagApplied: {
          fragmentName: "TagRelHistoryFragment",
          render: (application: TagRelHistoryFragment) => {
            if (!settings.showTagging)
              return null;
            if (!application.post)
              return null;
            
            return <SingleLineFeedEvent icon={<ForumIcon className={classes.feedIcon} icon="Tag"/>}>
              Applied to <LinkToPost post={application.post}/>
              {application.user && <> by <UsersName user={application.user}/></>}
              {" "}<FormatDate date={application.createdAt}/> ago
            </SingleLineFeedEvent>
          }
        },
        tagDiscussionComment: {
          fragmentName: "CommentsList",
          render: (comment: CommentsList) => {
            if (!settings.showComments)
              return null;
            return <div>
              <SingleLineFeedEvent icon={<ForumIcon className={classNames(classes.feedIcon, classes.commentIcon)} icon="Comment"/>}>
                <CommentsNode
                  treeOptions={{ tag, forceSingleLine: collapseAll }}
                  comment={comment}
                  loadChildrenSeparately={true}
                />
              </SingleLineFeedEvent>
            </div>
          }
        },
        wikiMetadataChanged: {
          fragmentName: "FieldChangeFragment",
          render: (metadataChanges: FieldChangeFragment) => {
            return <SingleLineFeedEvent
              icon={<ForumIcon className={classNames(classes.feedIcon)} icon="InfoCircle"/>}
            >
              <div><UsersName documentId={metadataChanges.userId}/> changed {Object.keys(metadataChanges.after).map(fieldName => {
                return <span key={fieldName}>{fieldName} from {""+metadataChanges.before[fieldName]} to {""+metadataChanges.after[fieldName]}</span>
              })}</div>
            </SingleLineFeedEvent>
          },
        },
        lensOrSummaryMetadataChanged: {
          fragmentName: "FieldChangeFragment",
          render: (metadataChanges: FieldChangeFragment) => {
            return <SingleLineFeedEvent
              icon={<ForumIcon className={classNames(classes.feedIcon)} icon="InfoCircle"/>}
            >
              <div><UsersName documentId={metadataChanges.userId}/> changed {Object.keys(metadataChanges.after).map(fieldName => {
                return <span key={fieldName}>{fieldName} from {""+metadataChanges.before[fieldName]} to {""+metadataChanges.after[fieldName]}</span>
              })}</div>
            </SingleLineFeedEvent>
          },
        },
      }}
    />
    </RevealHiddenBlocks>
    </div>
  </DeferRender></SingleColumnSection>
}

const TagHistoryFeedSettings = ({expanded, settings, setSettings, lenses}: {
  expanded: boolean,
  settings: TagHistorySettings
  setSettings: (newSettings: TagHistorySettings) => void
  lenses: TagLens[]
}) => {
  const { MenuItem } = Components;
  const classes = useStyles(tagHistoryStyles);
  if (!expanded) return null;

  return <div className={classes.settings}>
    <div className={classes.dropdownSetting}>
      Format
      <Select
        value={settings.displayFormat}
        onChange={ev => {
          setSettings({...settings, displayFormat: ev.target.value as "expanded"|"dense"})
        }}
      >
        <MenuItem value="expanded">Expanded</MenuItem>
        <MenuItem value="dense">Dense</MenuItem>
      </Select>
    </div>
    <div className={classes.checkboxSetting}>
      <Checkbox
        className={classes.checkbox}
        checked={settings.showEdits}
        onChange={ev => setSettings({...settings, showEdits: ev.target.checked})}
      />
      <span className={classes.label}>Show edits to contents</span>
    </div>
    <div className={classes.checkboxSetting}>
      <Checkbox
        className={classes.checkbox}
        checked={settings.showSummaryEdits}
        onChange={ev => setSettings({...settings, showSummaryEdits: ev.target.checked})}
      />
      <span className={classes.label}>Show edits to summaries</span>
    </div>
    <div className={classes.checkboxSetting}>
      <Checkbox
        className={classes.checkbox}
        checked={settings.showTagging}
        onChange={ev => setSettings({...settings, showTagging: ev.target.checked})}
      />
      <span className={classes.label}>Show tagging</span>
    </div>
    <div className={classes.checkboxSetting}>
      <Checkbox
        className={classes.checkbox}
        checked={settings.showComments}
        onChange={ev => setSettings({...settings, showComments: ev.target.checked})}
      />
      <span className={classes.label}>Show comments</span>
    </div>
    <div className={classes.checkboxSetting}>
      <Checkbox
        className={classes.checkbox}
        checked={settings.showMetadata}
        onChange={ev => setSettings({...settings, showMetadata: ev.target.checked})}
      />
      <span className={classes.label}>Show changes to metadata</span>
    </div>
    {hasWikiLenses && lenses.length > 1 && <div>
      Lens
      <Select
        value={settings.lensId}
        onChange={ev => {
          setSettings({
            ...settings,
            lensId: ev.target.value,
          });
        }}
      >
        <MenuItem value="all">All lenses</MenuItem>
        {lenses.map(lens =>
          <MenuItem key={lens._id} value={lens._id}>{`${lens.tabTitle}${lens.tabSubtitle ? `: ${lens.tabSubtitle}` : ""}${lens.deleted ? " [Deleted]" : ""}`}</MenuItem>
        )}
      </Select>
    </div>}
  </div>
}

const TagHistoryPageComponent = registerComponent("TagHistoryPage", TagHistoryPage);

declare global {
  interface ComponentTypes {
    TagHistoryPage: typeof TagHistoryPageComponent
  }
}
