import React, { ReactNode } from 'react';
import ForumButton from "../../common/ForumButton";
import Loading from "../../vulcan-core/Loading";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ActionButtonSection", (theme: ThemeType) => ({
  blurb: {
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
    color: theme.palette.grey[800],
    marginBottom: 16
  },
}));

type ActionButtonSectionProps = {
  buttonText: string;
  buttonProps: Partial<Omit<ComponentProps<typeof ForumButton>, "onClick">>;
  description: ReactNode;
  loading?: boolean;
  onClick: () => void;
};

const ActionButtonSection = ({
  buttonText,
  buttonProps,
  description,
  loading = false,
  onClick,
}: ActionButtonSectionProps) => {
  const classes = useStyles(styles);
  return (
    <div>
      <div className={classes.blurb}>{description}</div>
      <ForumButton {...buttonProps} onClick={onClick}>
        {!loading ? buttonText : <Loading />}
      </ForumButton>
    </div>
  );
};

export default ActionButtonSection;




