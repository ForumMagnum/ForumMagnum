import React, {useState, useEffect} from 'react'
import {Components, registerComponent, useStyles} from '../../lib/vulcan-lib'
import {gql, useLazyQuery} from '@apollo/client'
import {useNavigate} from '@/lib/reactRouterWrapper.tsx'
import Button from '@material-ui/core/Button'
import { useCurrentUser } from '../common/withUser'
import { EditorContents } from '../editor/Editor'

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: "100%",
    background: theme.palette.panelBackground.default,
    padding: '12px 16px',
    borderRadius: theme.borderRadius.quickTakesEntry,
    marginTop: 24,
  },
  loadingDots: {
    marginTop: -8,
  },

  input: {
    fontWeight: 500,
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.borderRadius.small,
    padding: '12px 8px',
    '&:hover, &:focus': {
      backgroundColor: theme.palette.grey[200],
    },
    flexGrow: 1,
  },
  formButton: {
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  inputGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '1em',
  },
  error: {
    lineHeight: "18px",
    textAlign: "center",
    color: theme.palette.error.main
  },
})

/**
 * todo: url validation and empty url handling
 * displaying error meaningfully
 * display linkposts
 * 
 */
const ImportExternalPost = ({classes, filter, sort}: {
  classes: ClassesType<typeof styles>,
  filter?: any,
  sort?: any,
}) => {
  const [value, setValue] = useState('')
  const [postId, setPostId] = useState('')
  const [editorValue, setEditorValue] = useState<EditorContents>({value: '', type: 'ckEditorMarkup'})
  const currentUser = useCurrentUser()

  const navigate = useNavigate()
  const { Editor, Loading, Typography } = Components

  // Import useLazyQuery from Apollo Client
  const [importUrlAsDraftPost, {data, loading, error}] = useLazyQuery(gql`
    query importUrlAsDraftPost($url: String!) {
      importUrlAsDraftPost(url: $url)
    }
  `)

  useEffect(() => {
    if (data) {
      const {_id, slug} = data.importUrlAsDraftPost

      if (_id && slug) {
        setPostId(_id)
        // navigate(`/editPost?postId=${postId}`)
      } else {
        throw new Error('Post ID or slug not found in data:', data.importUrlAsDraftPost)
      }
    }
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error)
    }
  }, [data, error, navigate])

  const handleKeyPress = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const result = await importUrlAsDraftPost({variables: {url: value}})
      console.log({result})
    }
  }
  /**
   * todo rationalsphere - show all linkposts
   * show new item when imported in the list
   * explore highligthing of the source domain name
   *
   * 2 groups of tabs - your stuff, exploratory stuff - add visual sepration in tabs
   */

  return <div className={classes.root}>
    <Typography variant="body2">Nominate a post from a broader Rationality community by importing it to LessWrong</Typography>
    <div className={classes.inputGroup}>
      <input
        className={classes.input}
        type="url"
        placeholder="Post URL"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
        }}
        onKeyDown={handleKeyPress}
      />
      <Button className={classes.formButton} onClick={() => importUrlAsDraftPost({variables: {url: value}})}>
        {loading ? <Loading className={classes.loadingDots}/> : <>Import Post</>}
      </Button>

      {/* <Editor collectionName='Comments' fieldName='contents' currentUser={currentUser} _classes={classes} formType='new' initialEditorType='ckEditorMarkup' value={editorValue} isCollaborative={false} onChange={(change: EditorChangeEvent) => {
        setEditorValue(change.contents.value)
      }} /> */}
    </div>
    {error && <div className={classes.error}>{error.message}</div>}
  </div>

}

const ImportExternalPostComponent = registerComponent('ImportExternalPost', ImportExternalPost, {styles})

declare global {
  interface ComponentTypes {
    ImportExternalPost: typeof ImportExternalPostComponent;
  }
}
