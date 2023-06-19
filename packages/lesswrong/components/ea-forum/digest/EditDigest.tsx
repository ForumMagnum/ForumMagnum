import React, { useEffect, useMemo, useState } from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../../lib/vulcan-lib';
import { useMulti } from '../../../lib/crud/withMulti';
import { gql, useQuery } from '@apollo/client';
import { SettingsOption } from '../../../lib/collections/posts/dropdownOptions';
import FilterIcon from '@material-ui/icons/FilterList';
import { useMessages } from '../../common/withMessages';
import { DIGEST_STATUSES } from '../../../lib/collections/digestPosts/schema';
import { useCreate } from '../../../lib/crud/withCreate';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useLocation } from '../../../lib/routeUtil';
import { getDigestName, getEmailDigestPostListData } from '../../../lib/collections/digests/helpers';
import { useCurrentUser } from '../../common/withUser';
import { userIsAdmin } from '../../../lib/vulcan-users/permissions';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 1400,
    margin: '10px auto'
  },
  noPosts: {
    textAlign: 'center',
    color: theme.palette.grey[800],
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    marginTop: 30
  },
  topSection: {
    paddingLeft: 12,
    marginBottom: 10
  },
  headlineRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    columnGap: 20
  },
  headlineText: {
    flex: '1 1 0'
  },
  copyDigest: {
    alignSelf: 'center',
  },
  copyDigestIcon: {
    color: theme.palette.primary.main,
    fontSize: 26,
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.primary.dark,
    },
  },
  filters: {
    display: 'flex',
    alignItems: 'flex-end',
    columnGap: 14,
    marginTop: 12,
    marginBottom: 10
  },
  filterIcon: {
    color: theme.palette.grey[600],
    fontSize: 20,
    marginRight: 4,
    marginBottom: 8
  },
  filter: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '2px',
  },
  filterLabel: {
    color: theme.palette.grey[600],
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    lineHeight: '18px',
    fontWeight: '500',
    paddingLeft: 12
  },
  resetFilters: {
    flex: '1 1 0',
    textAlign: 'right'
  },
  resetFiltersBtn: {
    background: 'none',
    color: theme.palette.grey[800],
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '18px',
    '&:hover': {
      color: theme.palette.grey[1000],
    }
  },
  table: {
    background: theme.palette.grey[0],
    width: '100%',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    lineHeight: '18px',
    textAlign: 'left',
    borderCollapse: 'collapse',
    '& th': {
      position: 'sticky',
      top: 0,
      background: theme.palette.grey[250],
      zIndex: theme.zIndexes.karmaChangeNotifier
    },
    '& th,td': {
      minWidth: 72,
      padding: 5,
      '&:first-child': {
        padding: '5px 5px 5px 14px'
      },
      '&:last-child': {
        padding: '5px 14px 5px 5px'
      }
    }
  },
  centeredColHeader: {
    textAlign: 'center',
  },
  total: {
    color: theme.palette.grey[600],
    fontSize: 12
  },
  totalHigh: {
    color: theme.palette.text.red
  }
})

type DigestPlannerPostData = {
  post: PostsListBase,
  digestPost: DigestPost
  rating: number
}
const DIGEST_STATUS_OPTIONS = [...DIGEST_STATUSES, 'pending'] as const
type InDigestStatusOptions = typeof DIGEST_STATUS_OPTIONS
type InDigestStatusOption = InDigestStatusOptions[number]
export type DigestPost = {
  _id: string,
  emailDigestStatus: InDigestStatusOption,
  onsiteDigestStatus: InDigestStatusOption
}
type TagUsage = {
  _id: string,
  name: string,
  core: boolean,
  count: number
}


const EditDigest = ({classes}:{classes: ClassesType}) => {
  const {params} = useLocation()
  const {flash} = useMessages()
  const currentUser = useCurrentUser()
  
  // get the digest based on the num from the URL
  const {results} = useMulti({
    terms: {
      view: "findByNum",
      num: parseInt(params.num)
    },
    collectionName: "Digests",
    fragmentName: 'DigestsMinimumInfo',
    limit: 1,
    skip: !userIsAdmin(currentUser)
  })
  const digest = results?.[0]
  
  
  // get the list of posts eligible for this digest
  const { data } = useQuery(gql`
    query getDigestPlannerData($digestId: String, $startDate: Date, $endDate: Date) {
      DigestPlannerData(digestId: $digestId, startDate: $startDate, endDate: $endDate) {
        post {
          ...PostsListBase
        }
        digestPost {
          _id
          emailDigestStatus
          onsiteDigestStatus
        }
        rating
      }
    }
    ${fragmentTextForQuery("PostsListBase")}
    `, {
      ssr: true,
      skip: !digest,
      variables: {digestId: digest?._id, startDate: digest?.startDate, endDate: digest?.endDate},
    }
  )
  const eligiblePosts: DigestPlannerPostData[] = useMemo(() => data?.DigestPlannerData, [data])

  // save the list of all eligible posts, along with their ratings
  const [posts, setPosts] = useState<Array<PostsListBase & {rating:number}>>()
  // track the digest status of each post (i.e. whether or not it's in the email and on-site digests)
  const [postStatuses, setPostStatuses] = useState<Record<string, DigestPost>>({})
  // disable all status icons while processing the previous click
  const [statusIconsDisabled, setStatusIconsDisabled] = useState<boolean>(false)
  
  useEffect(() => {
    // this is just to initialize the list of posts and statuses
    if (!eligiblePosts || posts) return
    
    const newPosts: Array<PostsListBase & {rating:number}> = []
    const newPostStatuses: Record<string,DigestPost> = {}
    eligiblePosts.forEach(postData => {
      newPosts.push({...postData.post, rating: postData.rating})
      newPostStatuses[postData.post._id] = {
        _id: postData.digestPost._id,
        emailDigestStatus: postData.digestPost.emailDigestStatus ?? 'pending',
        onsiteDigestStatus: postData.digestPost.onsiteDigestStatus ?? 'pending'
      }
    })
    // sort the list by curated, then rating, then karma
    newPosts.sort((a,b) => {
      if (a.curatedDate && !b.curatedDate) return -1
      if (!a.curatedDate && b.curatedDate) return 1
      // TODO: add this back in once we've implemented the rating
      // if (a.rating !== b.rating) return b.rating - a.rating
      return b.baseScore - a.baseScore
    })
    setPosts(newPosts)
    setPostStatuses(newPostStatuses)
  }, [eligiblePosts])
  
  // the digest status of each post is saved on a DigestPost record
  const { create: createDigestPost } = useCreate({
    collectionName: 'DigestPosts',
    fragmentName: 'DigestPostsMinimumInfo',
  })
  const { mutate: updateDigestPost } = useUpdate({
    collectionName: 'DigestPosts',
    fragmentName: 'DigestPostsMinimumInfo',
  })
  
  // track the table filters
  const [emailDigestFilter, setEmailDigestFilter] = useState<InDigestStatusOption[]>(["yes","maybe","pending","no"])
  const [onsiteDigestFilter, setOnsiteDigestFilter] = useState<InDigestStatusOption[]>(["yes","maybe","pending","no"])
  const [tagFilter, setTagFilter] = useState<string>('')
  
  const handleUpdateEmailDigestFilter = (val: InDigestStatusOption) => {
    let newFilter = [...emailDigestFilter]
    if (newFilter.includes(val)) {
      newFilter = newFilter.filter(v => v !== val)
    } else {
      newFilter.push(val)
    }
    setEmailDigestFilter(newFilter)
  }
  
  const handleUpdateOnsiteDigestFilter = (val: InDigestStatusOption) => {
    let newFilter = [...onsiteDigestFilter]
    if (newFilter.includes(val)) {
      newFilter = newFilter.filter(v => v !== val)
    } else {
      newFilter.push(val)
    }
    setOnsiteDigestFilter(newFilter)
  }
  
  const resetFilters = () => {
    setEmailDigestFilter(["yes","maybe","pending","no"])
    setOnsiteDigestFilter(["yes","maybe","pending","no"])
    setTagFilter('')
  }
  
  
  /**
   * When you click on a digest status cell, we rotate the status between
   * "yes", "maybe", "no", and "pending" (in that order).
   */
  const handleClickStatusIcon = async (postId: string, statusField: 'emailDigestStatus'|'onsiteDigestStatus') => {
    // disable updating statuses while we handle this one,
    // to avoid creating duplicate DigestPost records
    setStatusIconsDisabled(true)
    void updatePostDigestStatus(postId, statusField).then(() => setStatusIconsDisabled(false))
  }

  const updatePostDigestStatus = async (postId: string, statusField: 'emailDigestStatus'|'onsiteDigestStatus') => {
    const newPostStatuses = {...postStatuses}
    // find the next status in the rotation
    let newStatus: InDigestStatusOption = 'pending'
    switch (newPostStatuses[postId][statusField]) {
      case 'yes':
        newStatus = 'maybe'
        break
      case 'maybe':
        newStatus = 'no'
        break
      case 'no':
        newStatus = 'pending'
        break
      case 'pending':
        newStatus = 'yes'
        break
    }
    newPostStatuses[postId][statusField] = newStatus
    
    // also save the change to the db
    const digestPostId = newPostStatuses[postId]._id
    if (digestPostId) {
      // we don't save the "pending" status in the db, we just use null
      void updateDigestPost({
        selector: {_id: digestPostId},
        data: {
          [statusField]: (newStatus === 'pending') ? null : newStatus
        }
      })
    } else if (digest) {
      // this should only happen when setting a status to "yes"
      const response = await createDigestPost({
        data: {
          postId,
          digestId: digest._id,
          [statusField]: newStatus
        }
      })
      newPostStatuses[postId]._id = response.data?.createDigestPost.data._id
    }
    
    // update the page state
    setPostStatuses(newPostStatuses)
  }
  
  /**
   * Writes the post data for all posts in the email digest to the clipboard,
   * in the format that we expect to see in the email digest:
   *
   * 1. <post title as link> (<post authors>, <read time> min)
   * 2. ...
   */
  const copyDigestToClipboard = () => {
    if (!posts) return
    
    const digestPosts = posts.filter(p => postStatuses[p._id].emailDigestStatus === 'yes')

    void navigator.clipboard.write(
      [new ClipboardItem({
        'text/html': new Blob([getEmailDigestPostListData(digestPosts)], {type: 'text/html'})
      })]
    ).then(
      () => flash({messageString: "Email digest post list copied"})
    )
  }

  const { Loading, SectionTitle, ForumDropdown, ForumDropdownMultiselect, ForumIcon, LWTooltip,
    EditDigestPublishBtn, EditDigestTableRow, Error404 } = Components
  
  // list of the most common tags in the overall posts list
  const tagCounts = useMemo(() => posts?.reduce((tagsList: TagUsage[], post) => {
    post.tags?.forEach(tag => {
      const prevTagData = tagsList.find(t => t._id === tag._id)
      if (prevTagData) {
        prevTagData.count += 1
      } else {
        tagsList.push({
          _id: tag._id,
          name: tag.name,
          core: tag.core,
          count: 1
        })
      }
    })
    return tagsList
  }, []).sort((a,b) => b.count - a.count), [posts])
  
  // we allow the user to filter by any tags associated with >= 3 posts
  const coreAndPopularTags = useMemo(() => tagCounts?.filter(tag => tag.core || tag.count >= 3), [tagCounts])
  const coreAndPopularTagIds = useMemo(() => coreAndPopularTags?.map(tag => tag._id), [coreAndPopularTags])
  
  // get the list of posts visible in the table
  const visiblePosts = useMemo(() => {
    if (!posts || !postStatuses) return null

    let visiblePosts = posts
    // filter by the selected tag
    if (tagFilter) {
      visiblePosts = visiblePosts.filter(post => post.tags.find(tag => tag._id === tagFilter))
    }
    // then filter by selected digest statuses (i.e. whether or not the post is in the email or on-site digest)
    visiblePosts = visiblePosts.filter(post => {
      return emailDigestFilter.includes(postStatuses[post._id].emailDigestStatus) &&
        onsiteDigestFilter.includes(postStatuses[post._id].onsiteDigestStatus)
    })
    return visiblePosts
  }, [posts, postStatuses, tagFilter, emailDigestFilter, onsiteDigestFilter])
  
  // calculate post counts for different filters
  const postCounts = useMemo(() => {
    if (!visiblePosts || !coreAndPopularTagIds) return null

    const tagCounts = coreAndPopularTagIds.reduce((prev: Record<string, number>, next) => {
      prev[next] = 0
      return prev
    }, {})
    const counts = {
      email: {
        yes: 0,
        maybe: 0,
        pending: 0,
        no: 0
      },
      onsite: {
        yes: 0,
        maybe: 0,
        pending: 0,
        no: 0
      },
      tag: tagCounts
    }
    
    visiblePosts.forEach(post => {
      const postEmailDigestStatus = postStatuses[post._id].emailDigestStatus
      const postOnsiteDigestStatus = postStatuses[post._id].onsiteDigestStatus

      DIGEST_STATUS_OPTIONS.forEach(status => {
        if (postEmailDigestStatus === status) counts.email[status]++
        if (postOnsiteDigestStatus === status) counts.onsite[status]++
      })
      post.tags.forEach(tag => {
        if (tag._id in counts.tag) counts.tag[tag._id]++
      })

    })
    return counts
  }, [visiblePosts, coreAndPopularTagIds, postStatuses])
  
  // set up the options for each filter, including their post counts
  const emailDigestOptions = useMemo(() => {
    if (!postCounts) return null
    return {
      yes: {label: `Yes (${postCounts.email.yes})`},
      maybe: {label: `Maybe (${postCounts.email.maybe})`},
      pending: {label: `Pending (${postCounts.email.pending})`},
      no: {label: `No (${postCounts.email.no})`}
    }
  }, [postCounts])
  
  const onsiteDigestOptions = useMemo(() => {
    if (!postCounts) return null
    return {
      yes: {label: `Yes (${postCounts.onsite.yes})`},
      maybe: {label: `Maybe (${postCounts.onsite.maybe})`},
      pending: {label: `Pending (${postCounts.onsite.pending})`},
      no: {label: `No (${postCounts.onsite.no})`}
    }
  }, [postCounts])
  
  const tagOptions = useMemo(() => {
    if (!coreAndPopularTags || !visiblePosts || !postCounts) return null
    return coreAndPopularTags.reduce((prev: Record<string, SettingsOption>, next) => {
      prev[next._id] = {label: `${next.name} (${postCounts.tag[next._id]})`}
      return prev
    }, {'': {label: `All posts (${visiblePosts.length})`}})
  }, [coreAndPopularTags, visiblePosts, postCounts])
  
  if (!userIsAdmin(currentUser)) {
    return <Error404 />
  }

  // show the loading spinner while we're still loading the data
  if (
    !digest || !posts || !coreAndPopularTagIds || !visiblePosts ||
    !tagOptions || !emailDigestOptions || !onsiteDigestOptions
  ) {
    return <Loading />
  }
  
  // if we have no posts to display, just show the page heading
  const pageHeadingNode = <SectionTitle
    title={getDigestName({digest})}
    noTopMargin
  />
  if (!posts.length) {
    return <div className={classes.root}>
      {pageHeadingNode}
      <div className={classes.noPosts}>No eligible posts yet - come back later! :)</div>
    </div>
  }
  
  // calculate total post counts for email & on-site digests, to display in the column headers
  const emailTotal = posts?.filter(p => postStatuses[p._id].emailDigestStatus === 'yes')?.length ?? 0
  const onsiteTotal = posts?.filter(p => postStatuses[p._id].onsiteDigestStatus === 'yes')?.length ?? 0

  
  return (
    <div className={classes.root}>
      <div className={classes.topSection}>
        <div className={classes.headlineRow}>
          <div className={classes.headlineText}>{pageHeadingNode}</div>
          <LWTooltip
            title="Click to copy email digest post list"
            placement="bottom"
            className={classes.copyDigest}
          >
            <ForumIcon icon="ClipboardDocumentList" className={classes.copyDigestIcon} onClick={() => copyDigestToClipboard()} />
          </LWTooltip>
          <EditDigestPublishBtn digest={digest} />
        </div>
        
        <div className={classes.filters}>
          <FilterIcon className={classes.filterIcon} />
          <div className={classes.filter}>
            <label className={classes.filterLabel}>In email digest?</label>
            <ForumDropdownMultiselect
              values={emailDigestFilter}
              options={emailDigestOptions}
              onSelect={handleUpdateEmailDigestFilter} />
          </div>
          <div className={classes.filter}>
            <label className={classes.filterLabel}>In on-site digest?</label>
            <ForumDropdownMultiselect
              values={onsiteDigestFilter}
              options={onsiteDigestOptions}
              onSelect={handleUpdateOnsiteDigestFilter} />
          </div>
          <div className={classes.filter}>
            <label className={classes.filterLabel}>Filter by tag</label>
            <ForumDropdown value={tagFilter} options={tagOptions} onSelect={setTagFilter} />
          </div>
          <div className={classes.resetFilters}>
            <button type="button" className={classes.resetFiltersBtn} onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        </div>
      </div>
      
      <table className={classes.table}>
        <thead>
          <tr className={classes.headerRow}>
            <th className={classes.centeredColHeader}>
              Email?
              <div className={classNames(classes.total, {[classes.totalHigh]: emailTotal > 10})}>
                {emailTotal}
              </div>
            </th>
            <th className={classes.centeredColHeader}>
              On-site?
              <div className={classNames(classes.total, {[classes.totalHigh]: onsiteTotal > 30})}>
                {onsiteTotal}
              </div>
            </th>
            <th>Post</th>
            <th>Tags</th>
            <th>Suggested curation</th>
            {/* <th className={classes.centeredColHeader}>Rating</th> */}
            <th className={classes.centeredColHeader}>Comments</th>
          </tr>
        </thead>
        <tbody>
          {visiblePosts.map(post => {
            return <EditDigestTableRow
              key={post._id}
              post={post}
              postStatus={postStatuses[post._id]}
              statusIconsDisabled={statusIconsDisabled}
              handleClickStatusIcon={handleClickStatusIcon}
              visibleTagIds={coreAndPopularTagIds}
              setTagFilter={setTagFilter}
            />
          })}
        </tbody>
      </table>
    </div>
  )
}

const EditDigestComponent = registerComponent('EditDigest', EditDigest, {styles});

declare global {
  interface ComponentTypes {
    EditDigest: typeof EditDigestComponent
  }
}
