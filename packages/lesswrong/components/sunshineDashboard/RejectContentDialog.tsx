import Button from '@/lib/vendor/@material-ui/core/src/Button';
import Checkbox from '@/lib/vendor/@material-ui/core/src/Checkbox';
import { Paper, Card }from '@/components/widgets/Paper';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import classNames from 'classnames';
import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import EditIcon from '@/lib/vendor/@material-ui/icons/src/Edit'
import { Link } from '../../lib/reactRouterWrapper';
import LWTooltip from "../common/LWTooltip";
import { ContentItemBody } from "../contents/ContentItemBody";
import ContentStyles from "../common/ContentStyles";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import CKEditor from '../../lib/vendor/ckeditor5-react/ckeditor';
import { getCkCommentEditor } from '../../lib/wrapCkEditor';
import type { Editor } from '@ckeditor/ckeditor5-core';

const ModerationTemplateFragmentMultiQuery = gql(`
  query multiModerationTemplateRejectContentDialogQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  dialogContent: {
    width: 400,
    backgroundColor: theme.palette.panelBackground.default,
    padding: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  rejectionCheckboxes: {
    display: 'flex',
    flexDirection: 'column'
  },
  checkbox: {
    paddingTop: 2,
    paddingBottom: 2
  },
  modalTextField: {
    marginTop: 10,
  },
  hideModalTextField: {
    display: 'none'
  },
  editorContainer: {
    marginTop: 10,
    minHeight: 150,
    '& .ck-editor__editable': {
      minHeight: 150,
    },
  },
  hideEditorContainer: {
    display: 'none'
  },
  defaultIntroMessage: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 4,
    fontSize: 14,
    '& p': {
      margin: '0 0 10px 0',
      '&:last-child': {
        margin: 0,
      }
    },
    '& a': {
      color: theme.palette.primary.main,
    }
  },
  defaultIntroHeader: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.grey[600],
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    padding: 12,
    width: 500,
  },
  reason: {
    '&:hover $editIcon': {
      opacity: 1
    }
  },
  editIcon: {
    height: 12,
    color: theme.palette.grey[500],
    opacity: .2
  },
  loadMore: {
    paddingTop: 6,
    paddingLeft: 12,
    paddingBottom: 6
  },
  topReason: {
    fontWeight: 600
  },
  nonTopReason: {
    opacity: .6
  }
});

const RejectContentDialog = ({classes, rejectContent}: {
  classes: ClassesType<typeof styles>,
  rejectContent: (reason: string) => void,
}) => {
  const [selections, setSelections] = useState<Record<string,boolean>>({});
  const [hideTextField, setHideTextField] = useState(true);
  const [rejectedReason, setRejectedReason] = useState('');
  const [showMore, setShowMore] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null);

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(ModerationTemplateFragmentMultiQuery, {
    variables: {
      selector: { moderationTemplatesList: { collectionName: "Rejections" } },
      limit: 25,
      enableTotal: true,
    },
  });

  const rejectionTemplates = data?.moderationTemplates?.results;

  if (!rejectionTemplates) return null;
  
  const rejectionReasons = Object.fromEntries(rejectionTemplates.map(({name, contents}) => [name, contents?.html]))

  const handleClick = () => {
    rejectContent(rejectedReason);
  };

  const composeRejectedReason = (label: string, checked: boolean) => {
    const newSelections = {...selections, [label]: checked};
    setSelections(newSelections);

    const composedReason = `<ul>${
      Object.entries(newSelections)
        .filter(([_, reasonSelected]) => reasonSelected)
        .map(([reasonKey]) => `<li>${rejectionReasons[reasonKey]}</li>`)
        .join('')
    }</ul>`;

    setRejectedReason(composedReason);
    if (editor) {
      editor.setData(composedReason);
    }
  };

  const CommentEditor = getCkCommentEditor();

  const editorConfig = {
    toolbar: [
      'bold',
      'italic',
      '|',
      'link',
      '|',
      'bulletedList',
      'numberedList',
      '|',
      'blockQuote',
    ],
    placeholder: 'Enter rejection reason...',
  };

  // Standard rejection intro that will be prepended to the message
  const standardIntroHtml = `
    <p>Unfortunately, I rejected your [content].</p>
    <p>LessWrong aims for particularly high quality (and somewhat oddly-specific) discussion quality. We get a lot of content from new users and sadly can't give detailed feedback on every piece we reject, but I generally recommend checking out our <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong">New User's Guide</a>, in particular the section on <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong#How_to_ensure_your_first_post_or_comment_is_well_received">how to ensure your content is approved</a>.</p>
    <p>Your content didn't meet the bar for at least the following reason(s):</p>
  `;

  const dialogContent = <div className={classes.rejectionCheckboxes}>
    {rejectionTemplates.map((template, i) => {
      const top6 = i < 6;
      return <div key={`rejection-reason-${template.name}`} className={classes.reason}>
        <LWTooltip placement="right-end" tooltip={false} title={<Card className={classes.card}>
          <ContentStyles contentType='comment'>
            <ContentItemBody dangerouslySetInnerHTML={{__html: template.contents?.html || ""}} />
          </ContentStyles>
        </Card>}>
          <div className={top6 ? classes.topReason : classes.nonTopReason}>
            <Checkbox
              checked={selections[template.name]}
              onChange={(_, checked) => composeRejectedReason(template.name, checked)}
              className={classes.checkbox}
            />
            {template.name} <Link to={`/admin/moderationTemplates#${template._id}`} target="_blank"><EditIcon className={classes.editIcon}/></Link>
          </div>
        </LWTooltip>
      </div>
    })}
    <div className={classes.loadMore}>
      <LoadMore {...loadMoreProps} />
    </div>
    <div className={classNames(classes.editorContainer, { [classes.hideEditorContainer]: hideTextField })}>
      <div className={classes.defaultIntroMessage}>
        <ContentStyles contentType='comment'>
          <ContentItemBody dangerouslySetInnerHTML={{__html: standardIntroHtml}} />
        </ContentStyles>
      </div>
      <CKEditor
        editor={CommentEditor}
        data={rejectedReason}
        config={editorConfig}
        isCollaborative={false}
        onReady={(editor: Editor) => {
          setEditor(editor);
        }}
        onChange={(event: any, editor: Editor) => {
          const data = editor.getData();
          setRejectedReason(data);
        }}
      />
    </div>
  </div>
  
  return (
    <Paper>
      <div className={classes.dialogContent}>
        {dialogContent}
        <Button onClick={handleClick}>
          Reject
        </Button>
        <Button onClick={() => setHideTextField(!hideTextField)}>
          Edit Message
        </Button>
      </div>
    </Paper>
  )
};

export default registerComponent('RejectContentDialog', RejectContentDialog, { styles });


