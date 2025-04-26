import Tab from "@/lib/vendor/@material-ui/core/src/Tab";
import Tabs from "@/lib/vendor/@material-ui/core/src/Tabs";
import React, { useCallback, useRef } from "react";
import { EditablePost, isPostCategory } from "../../lib/collections/posts/helpers";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { TypedFieldApi } from "../tanstack-form-components/BaseAppForm";

const styles = defineStyles('EditPostCategory', (theme: ThemeType) => ({
  tabs: {
    width: "100%",
    "& .MuiTab-root": {
      fontSize: 14,
      fontWeight: 600,
      minWidth: "unset",
    },
    "& .MuiTab-labelContainer": {
      padding: "6px 0px",
    },
    "& .MuiTabs-flexContainer": {
      gap: "24px",
    },
  },
}));

export const EditPostCategory = ({ field, post }: {
  field: TypedFieldApi<DbPost['postCategory']>;
  post: EditablePost;
}) => {
  const classes = useStyles(styles);
  const { postCategory, url } = post;
  const lastUrlRef = useRef(url);

  const handleChangeTab = useCallback(
    (_: React.ChangeEvent, value: string) => {
      if (!isPostCategory(value)) return; // Overkill but just to be safe

      const categoryQuestion = value === "question";
      const documentQuestion = post.question;
      const questionChanged = categoryQuestion !== documentQuestion;

      const isLinkpost = value === "linkpost";

      field.handleChange(value);
      if (questionChanged) {
        field.form.setFieldValue('question', categoryQuestion);
      }

      // Store the url value and restore it if they switch back to the linkpost tab
      if (!isLinkpost) {
        lastUrlRef.current = post.url;
        field.form.setFieldValue('url', '');
      } else {
        field.form.setFieldValue('url', lastUrlRef.current);
      }
    },
    [post.question, post.url, field]
  );

  return (
    <Tabs
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
  );
};
