import React, { useMemo, useState } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useTagBySlug } from '../useTag';
import { useLocation } from '../../../lib/routeUtil';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { getAvailableLenses, TagLens } from '@/lib/arbital/useTagLenses';
import keyBy from 'lodash/keyBy';
import { RevealHiddenBlocksContext } from '@/components/editor/conditionalVisibilityBlock/ConditionalVisibilityBlockDisplay';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import { hasWikiLenses } from '@/lib/betas';
import { tagGetUrl } from '@/lib/collections/tags/helpers';

const tagPageStyles = defineStyles("TagHistoryPage", (theme: ThemeType) => ({
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
}));

export interface TagHistorySettings {
  showEdits: boolean,
  showComments: boolean,
  showTagging: boolean
  lensId: string
}

export const defaultTagHistorySettings: TagHistorySettings = {
  showEdits: true,
  showComments: true,
  showTagging: true,
  lensId: "all",
};

const TagHistoryPage = () => {
  const classes = useStyles(tagPageStyles);
  const { params, query } = useLocation();
  const { slug } = params;
  const focusedUser: string = query.user;
  const { tag, loading: loadingTag } = useTagBySlug(slug, "TagHistoryFragment");
  const lenses = useMemo(() => getAvailableLenses(tag), [tag]);
  const lensesById = keyBy(lenses, l=>l._id);
  const { UsersName, SingleColumnSection, MixedTypeFeed, TagRevisionItem, LensRevisionItem, FormatDate, CommentsNode, Loading, LinkToPost, SingleLineFeedEvent, SectionTitle } = Components;
  const [settings, setSettings] = useState(defaultTagHistorySettings);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  
  if (loadingTag || !tag) {
    return <SingleColumnSection>
      <Loading/>
    </SingleColumnSection>
  }
  
  return <SingleColumnSection>
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
    <RevealHiddenBlocksContext.Provider value={true}>
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
          render: (creation: TagHistoryFragment) => <SingleLineFeedEvent>
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
                collapsed={!!focusedUser && focusedUser!==revision.user?.slug}
                revision={revision}
                headingStyle={"abridged"}
                documentId={tag._id}
                showDiscussionLink={false}
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
                collapsed={!!focusedUser && focusedUser!==revision.user?.slug}
                lens={lens}
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
            
            return <SingleLineFeedEvent>
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
              <CommentsNode
                treeOptions={{ tag }}
                comment={comment}
                loadChildrenSeparately={true}
              />
            </div>
          }
        }
      }}
    />
    </RevealHiddenBlocksContext.Provider>
    </div>
  </SingleColumnSection>
}

const TagHistoryFeedSettings = ({expanded, settings, setSettings, lenses}: {
  expanded: boolean,
  settings: TagHistorySettings
  setSettings: (newSettings: TagHistorySettings) => void
  lenses: TagLens[]
}) => {
  const { MenuItem } = Components;
  const classes = useStyles(tagPageStyles);
  if (!expanded) return null;

  return <div className={classes.settings}>
    <div className={classes.checkboxSetting}>
      <Checkbox
        className={classes.checkbox}
        checked={settings.showEdits}
        onChange={ev => setSettings({...settings, showEdits: ev.target.checked})}
      />
      <span className={classes.label}>Show edits</span>
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
          <MenuItem key={lens._id} value={lens._id}>{`${lens.tabTitle}${lens.tabSubtitle ? `: ${lens.tabSubtitle}` : ""}`}</MenuItem>
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
