import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { Column, Datatable } from '../vulcan-core/Datatable';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import sanitizeHtml from 'sanitize-html';
import { htmlToText } from 'html-to-text';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { sanitizeAllowedTags } from "../../lib/vulcan-lib/utils";
import { UsersName } from "../users/UsersName";
import { FormatDate } from "../common/FormatDate";
import { Error404 } from "../common/Error404";
import { SectionTitle } from "../common/SectionTitle";

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: 1200,
    fontFamily: theme.typography.fontFamily,
    whiteSpace: 'pre-line',
    margin: '0 auto',
    '& tbody tr:nth-child(2n)': {
      background: theme.palette.grey[30]
    },
    '& tbody tr:nth-child(2n-1)': {
      background: theme.palette.grey[0]
    },
    '& th': {
      padding: '14px 18px'
    },
    '& td': {
      padding: '14px 18px'
    }
  },
})

const UserDisplay = ({column, document}: {
  column: Column;
  document: any;
}) => {
  const user = document.user || document
  return <div>
    <UsersName user={user} nofollow />
  </div>
}

const PostDisplay = ({column, document}: {
  column: Column;
  document: any;
}) => {
  const post = document.post || document
  return <Link rel="nofollow" to={postGetPageUrl(post) + "#" + document._id }>{ post.title }</Link>
}

const CommentDisplay = ({column, document}: {
  column: Column;
  document: any;
}) => {
  const mainTextHtml = sanitizeHtml(
    document.contents.html, {
      allowedTags: sanitizeAllowedTags.filter(tag => !['img', 'iframe'].includes(tag)),
      nonTextTags: ['img', 'style']
    }
  )
  return <div>{htmlToText(mainTextHtml)}</div>
}

const DateDisplay = ({column, document}: {
  column: Column;
  document: any;
}) => {
  return <div>{document[column.name] && <FormatDate date={document[column.name]}/>}</div>
}

const columns: Column[] = [
  {
    name: 'postedAt',
    label: 'Posted',
    component: DateDisplay,
  },
  {
    name: 'post',
    component: PostDisplay,
  },
  {
    name: 'contents',
    label: 'Comment',
    component: CommentDisplay,
  },
  {
    name: 'user',
    label: 'Author',
    component: UserDisplay,
  },
  {
    name:'modGPTAnalysis',
    label: 'Analysis'
  },
]


const ModGPTDashboardInner = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser()
  
  if (!userIsAdminOrMod(currentUser)) {
    return <Error404 />
  }

  return (
    <div className={classes.root}>
      <SectionTitle title="ModGPT Dashboard" noTopMargin />

      <Datatable
        collectionName="Comments"
        columns={columns}
        fragmentName={'CommentsListWithModGPTAnalysis'}
        terms={{view: "checkedByModGPT"}}
        limit={10}
      />
    </div>
  )
}

export const ModGPTDashboard = registerComponent('ModGPTDashboard', ModGPTDashboardInner, {styles});


