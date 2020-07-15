import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Tags } from '../../lib/collections/tags/collection';
import { useTagBySlug } from './useTag';
import { commentBodyStyles } from '../../themes/stylePiping'
import { EditTagForm } from './EditTagPage';
import { userCanEditTagPortal } from '../../lib/betas'
import { useCurrentUser } from '../common/withUser';

const styles = theme => ({
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
    position: "absolute",
    right: 5,
    color: theme.palette.grey[600]
  }
})

const AllTagsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { results, loadMoreProps, totalCount, count } = useMulti({
    terms: {
      view: "allTagsHierarchical",
    },
    collection: Tags,
    fragmentName: "TagPreviewFragment",
    limit: 20,
    itemsPerPage: 100,
    ssr: true
  });

  const currentUser = useCurrentUser()
  const { tag } = useTagBySlug("portal", "TagFragment");
  const [ editing, setEditing ] = useState(false)

  const { AllTagsAlphabetical, TagsDetailsItem, SectionTitle, LoadMore, SectionFooter, ContentItemBody } = Components;

  return (
    <div className={classes.root}>
      <div className={classes.topSection}>
        <SectionTitle title="Tag Portal"/>
        <div className={classes.portal}>
          {userCanEditTagPortal(currentUser) && <a onClick={() => setEditing(true)} className={classes.edit}>
            Edit
          </a>}
          {editing && tag ?
            <EditTagForm tag={tag} successCallback={()=>setEditing(false)}/>
            :
            <ContentItemBody
              dangerouslySetInnerHTML={{__html: tag?.description.html || ""}}
              description={`tag ${tag?.name}`}
            />
          }
        </div>
      </div>
      <SectionTitle title="Tag Details"/>
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
      <AllTagsAlphabetical />
    </div>
  );
}

const AllTagsPageComponent = registerComponent("AllTagsPage", AllTagsPage, {styles});

declare global {
  interface ComponentTypes {
    AllTagsPage: typeof AllTagsPageComponent
  }
}
