import { registerComponent } from '../../lib/vulcan-lib';
import React, {useCallback} from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { isPostCategory } from '../../lib/collections/posts/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  tabs: {
    width: "100%",
    borderBottom: theme.palette.border.normal,
    '& .MuiTab-root': {
      fontSize: 14,
      fontWeight: 600,
      minWidth: "unset"
    },
    '& .MuiTab-labelContainer': {
      padding: "6px 0px",
    },
    '& .MuiTabs-flexContainer': {
      gap: "24px",
    }
  },
})

const EditPostCategory = ({document, value, path, placeholder, updateCurrentValues, classes}: {
  document: PostsBase,
  value: any,
  path: string,
  placeholder: string,
  updateCurrentValues: Function,
  classes: ClassesType
}) => {
  const { postCategory } = document;

  const handleChangeTab = useCallback((event, value) => {
    if (!isPostCategory(value)) return; // Overkill but just to be safe

    const categoryQuestion = value === "question";
    const documentQuestion = document.question;
    const questionChanged = categoryQuestion !== documentQuestion;

    updateCurrentValues({[path]: value, ...(questionChanged && {question: categoryQuestion})});
  }, [path, document.question, updateCurrentValues]);

  return <Tabs
    value={postCategory}
    indicatorColor="primary"
    textColor="primary"
    onChange={handleChangeTab}
    className={classes.tabs}
  >
    <Tab label="Post" key="post" value="post" />
    <Tab label="Linkpost" key="linkpost" value="linkpost" />
    <Tab label="Question" key="question" value="question" />
  </Tabs>
};

export const EditPostCategoryComponent = registerComponent( "EditPostCategory", EditPostCategory, {styles} );

declare global {
  interface ComponentTypes {
    EditPostCategory: typeof EditPostCategoryComponent
  }
}

