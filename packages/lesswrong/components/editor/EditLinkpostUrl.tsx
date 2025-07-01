import React from "react";
import Input from "@/lib/vendor/@material-ui/core/src/Input";
import { placeholderSetting } from "../../lib/publicSettings";
import type { EditablePost } from '../../lib/collections/posts/helpers';
import type { TypedFieldApi } from '@/components/tanstack-form-components/BaseAppForm';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Typography } from "../common/Typography";

const styles = defineStyles('EditLinkpostUrl', (theme: ThemeType) => ({
  root: {
    width: "100%",
    padding: 12,
    margin: "0 0 16px 0",
    backgroundColor: theme.palette.grey[100],
    boxSizing: "border-box",
    borderRadius: theme.borderRadius.default,
    fontSize: 14,
  },
  input: {
    marginTop: theme.spacing.unit,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderRadius: theme.borderRadius.default,
    padding: "8px 8px 5px 8px",
    color: theme.palette.grey[1000],
    fontSize: 14,
  },
  title: {
    color: theme.palette.grey[1000],
  },
}));

interface EditLinkpostUrlProps {
  field: TypedFieldApi<string | null | undefined>;
  post: EditablePost;
}

// TODO: these two fields were on the form definition in the schema, but didn't seem to actually do anything.
// hintText={isEAForum ? "UrlHintText" : "Please write what you liked about the post and sample liberally! If the author allows it, copy in the entire post text. (Link-posts without text get far fewer views and most people don't click offsite links.)"}
// labels={{ inactive: 'Link-post?', active: 'Add a linkpost URL' }}

export const EditLinkpostUrl = ({ field, post }: EditLinkpostUrlProps) => {
  const classes = useStyles(styles);

  const { postCategory } = post;
  if (postCategory !== "linkpost") return null;

  const value = field.state.value;

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => field.handleChange(event.target.value);

  return (
    <div className={classes.root}>
      <Typography variant="body2" className={classes.title}>
        This is a linkpost for
      </Typography>
      <Input
        className={classes.input}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholderSetting.get()}
        disableUnderline
        fullWidth
      />
    </div>
  );
};

