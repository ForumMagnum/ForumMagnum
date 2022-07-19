import React from 'react'
import { forumTypeSetting } from '../../../lib/instanceSettings';
import { registerComponent, Components } from '../../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: theme.typography.uiSecondary.fontFamily,
    textAlign: 'left',
    display: 'inline',
  },
  authorName: {
    fontWeight: 600,
    marginLeft: forumTypeSetting.get() === 'EAForum' ? 1 : 0,
  },
  newAuthorIcon: {
    height: 22,
    width: 18,
    verticalAlign: 'text-bottom',
    fill: theme.palette.icon.newAuthorIcon,
    marginLeft: 6
  }
})

const NewAuthorLeafIcon = ({className}) => {
//  return <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
//     width="60.000000pt" height="80.000000pt" viewBox="0 0 60.000000 80.000000"
//     preserveAspectRatio="xMidYMid meet" className={className}>

//     <g transform="translate(0.000000,80.000000) scale(0.100000,-0.100000)" stroke="none">
//       <path d="M197 733 c-4 -3 -7 -16 -7 -28 0 -25 -26 -77 -99 -195 -52 -83 -53
//         -86 -49 -151 4 -80 37 -137 94 -164 33 -15 44 -16 83 -6 41 11 46 10 69 -11
//         13 -13 31 -38 38 -55 15 -34 41 -44 50 -19 6 16 -19 71 -48 102 -19 22 -19 22
//         20 74 62 82 74 147 35 191 -11 13 -32 17 -99 16 -116 0 -129 -11 -129 -104 0
//         -61 4 -74 28 -106 23 -30 25 -38 13 -43 -23 -9 -74 26 -91 62 -31 65 -21 110
//         50 224 36 57 66 108 68 113 4 14 183 -101 221 -144 31 -34 36 -46 36 -90 0
//         -40 -6 -60 -30 -93 -16 -24 -36 -46 -45 -49 -8 -4 -15 -16 -15 -27 0 -37 45
//         -25 83 23 50 61 57 79 57 145 0 87 -33 130 -162 214 -60 39 -111 80 -121 98
//         -17 29 -36 38 -50 23z m53 -324 c8 -33 42 -32 50 1 7 29 47 40 56 16 13 -34
//         -70 -163 -99 -153 -24 7 -57 70 -57 106 0 59 38 82 50 30z"/>
//     </g>
//   </svg>
  
  return <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
      viewBox="0 0 489.486 489.486" className={className}>
    <g>
    <path d="M471.073,2.673c-98.5-11.5-149.6,16.1-176.2,44.8c-50,53.9-42,155.8-53.2,193.9c-19.3,18-32.6,40.9-42.7,64.8
      c-5.6-10.5-12.4-20.2-20.9-28.3c-9.6-96.6-22.9-114.6-36.5-130.3c-18.8-20.8-57.8-40-123-32.3c-7.3,0-13.5,5.2-16.7,11.5
      c-3.1,7.3-2.1,14.6,2.1,20.8c11.5,14.6,20.8,31.3,28.1,47.9c2.1,4.2,20.3,56.3,46.9,74c11.5,9.4,24.7,15.9,37.5,18.8
      c42.9,9.7,56.3,52.1,62.5,74l-11.5,104.2c-1,11.5,6.3,21.9,17.7,22.9c11.2,1.2,20-7.3,20.8-17.7c9.8-117,33.3-174,65.7-202.2
      c12.5-12,35.4-20.8,50-26.1c17.7-7.3,36.9-15.5,54.2-27.1c38-25.6,63.6-101.1,66.7-107.3c11.5-26.1,26.1-51.1,42.7-74
      C497.773,14.373,478.773,1.773,471.073,2.673z M74.973,191.273c-2.1-4.2-13.5-28.1-17.7-36.5c58.6-1.2,66.7,42.7,70.9,56.3
      c2.1,8.3,4.2,25,6.3,40.6C132.273,251.673,93.973,246.673,74.973,191.273z M398.073,110.973c-28.8,55.5-22.5,72.9-111.5,102.1
      c6.8-83.3,26.1-125.1,39.6-140.7c13.5-14.5,49.7-36.2,107.3-32.2C424.173,56.873,401.173,104.773,398.073,110.973z"/>
    </g>
  </svg>
}

const PostsAuthors = ({classes, post}: {
  classes: ClassesType,
  post: PostsDetails,
}) => {
  const { UsersName, PostsCoauthor, Typography, LWTooltip } = Components
  return <Typography variant="body1" component="span" className={classes.root}>
    by <span className={classes.authorName}>
      {!post.user || post.hideAuthor ? <Components.UserNameDeleted/> : <UsersName user={post.user} />}
      {forumTypeSetting.get() === 'EAForum' && <LWTooltip title="First post by this author">
        <NewAuthorLeafIcon className={classes.newAuthorIcon} />
      </LWTooltip>}
      {post.coauthors?.map(coauthor =>
        <PostsCoauthor key={coauthor._id} post={post} coauthor={coauthor} />
      )}
    </span>
  </Typography>
}

const PostsAuthorsComponent = registerComponent('PostsAuthors', PostsAuthors, {styles});

declare global {
  interface ComponentTypes {
    PostsAuthors: typeof PostsAuthorsComponent
  }
}
