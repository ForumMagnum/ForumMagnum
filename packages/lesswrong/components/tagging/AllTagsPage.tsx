import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useTagBySlug } from './useTag';
import { commentBodyStyles } from '../../themes/stylePiping'
import { EditTagForm } from './EditTagPage';
import { userCanEditTagPortal } from '../../lib/betas'
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link, QueryLink } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@material-ui/icons/AddBox';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { wikiGradeDefinitions } from '../../lib/collections/tags/schema';
import { useLocation } from '../../lib/routeUtil';
import { useDialog } from '../common/withDialog';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    margin: "auto",
    maxWidth: 1000
  },
  topSection: {
    maxWidth: 800,
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: theme.spacing.unit*8
  },
  alphabetical: {
    columns: 5,
    columnWidth: 200,
    columnGap: 0,
    background: "white",
    padding: 20,
    marginBottom: 24
  },
  portal: {
    marginTop: 18,
    ...commentBodyStyles(theme),
    marginBottom: 18,
    position: "relative",
    [theme.breakpoints.down('xs')]: {
      '& td': {
        display: 'block',
        width: '100% !important',
        height: 'inherit !important'
      }
    }
  },
  edit: {
    float: "right",
    marginRight: 5,
    color: theme.palette.grey[600],
  }
})

const reverseWikiGradeDescriptions = Object.fromEntries(Object.entries(wikiGradeDefinitions).map(([key, value]) => [value, key]))

const AllTagsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { query } = useLocation()
  const { openDialog } = useDialog()
  const wikiGrade = query?.tagFilter
  const { results, loadMoreProps, totalCount, count } = useMulti({
    terms: {
      view: "allTagsHierarchical",
      wikiGrade: reverseWikiGradeDescriptions[wikiGrade]
    },
    collectionName: "Tags",
    fragmentName: "TagFragment",
    limit: 5,
    itemsPerPage: 100,
  });

  const currentUser = useCurrentUser()
  const { tag } = useTagBySlug("portal", "TagFragment");
  const [ editing, setEditing ] = useState(false)
  // Type hack because MenuItem is too narrowly typed and doesn't properly take into account props-forwarding
  const UntypedMenuItem = MenuItem as any

  const { AllTagsAlphabetical, SectionButton, TagsDetailsItem, SectionTitle, LoadMore, SectionFooter, ContentItemBody } = Components;

  return (
    <AnalyticsContext pageContext="allTagsPage">
      <div className={classes.root}>
        <div className={classes.topSection}>
          <AnalyticsContext pageSectionContext="tagPortal">
            <SectionTitle title="Tags Portal">
              <SectionButton>
                <AddBoxIcon/>
                {currentUser ? 
                  <Link to="/tag/create">New Tag</Link> :
                  <a onClick={(ev) => {
                    openDialog({
                      componentName: "LoginPopup",
                      componentProps: {}
                    });
                    ev.preventDefault();
                  }}>New Tag</a>
                }
              </SectionButton>
            </SectionTitle>
            <div className={classes.portal}>
              {userCanEditTagPortal(currentUser) && <a onClick={() => setEditing(true)} className={classes.edit}>
                Edit
              </a>}
              {editing && tag ?
                <EditTagForm tag={tag} successCallback={()=>setEditing(false)}/>
                :
                <ContentItemBody
                  dangerouslySetInnerHTML={{__html: tag?.description?.html || ""}}
                  description={`tag ${tag?.name}`}
                />
              }
            </div>
          </AnalyticsContext>
        </div>
        <AnalyticsContext pageSectionContext="tagDetails">
          <SectionTitle title={`Tag Details`}>
            {forumTypeSetting.get() !== 'EAForum' && <Select
              value={wikiGrade||"none"}
              inputProps={{
                name: 'Showing All Tags'
              }}
            >
              <UntypedMenuItem value="none" component={QueryLink} query={{ tagFilter: undefined }}>
                No Filters
              </UntypedMenuItem>  
              {Object.entries(wikiGradeDefinitions).reverse().map(([value, name]) => {
                if(name === wikiGradeDefinitions[0]) return null
                if(name === wikiGradeDefinitions[1]) return null
                return <UntypedMenuItem key={value} value={name} component={QueryLink} query={{ tagFilter: name }}>
                  {name}
                </UntypedMenuItem>
              })}
            </Select>}
          </SectionTitle>
          <div>
            {results && results.map(tag => {
              return <TagsDetailsItem key={tag._id} tag={tag} />
            })}
            {results && !results.length && <div>
              There aren't any tags yet.
            </div>}
          </div>
          <SectionFooter>
            <LoadMore
              {...loadMoreProps}
              totalCount={totalCount}
              count={count}
            />
          </SectionFooter>
        </AnalyticsContext>
        <AnalyticsContext pageSectionContext="allTagsAlphabetical">
          <AllTagsAlphabetical />
        </AnalyticsContext>
      </div>
    </AnalyticsContext>
  );
}

const AllTagsPageComponent = registerComponent("AllTagsPage", AllTagsPage, {styles});

declare global {
  interface ComponentTypes {
    AllTagsPage: typeof AllTagsPageComponent
  }
}
