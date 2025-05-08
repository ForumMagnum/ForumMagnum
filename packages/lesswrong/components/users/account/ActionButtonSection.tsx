import React, { ReactNode } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { EAButton } from "../../ea-forum/EAButton";
import { Loading } from "../../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  blurb: {
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
    color: theme.palette.grey[800],
    marginBottom: 16
  },
});

type ActionButtonSectionProps = {
  buttonText: string;
  buttonProps: Partial<Omit<ComponentProps<typeof EAButton>, "onClick">>;
  description: ReactNode;
  loading?: boolean;
  onClick: () => void;
  classes: ClassesType<typeof styles>;
};

const ActionButtonSectionInner = ({
  buttonText,
  buttonProps,
  description,
  loading = false,
  onClick,
  classes,
}: ActionButtonSectionProps) => {
  return (
    <div>
      <div className={classes.blurb}>{description}</div>
      <EAButton {...buttonProps} onClick={onClick}>
        {!loading ? buttonText : <Loading />}
      </EAButton>
    </div>
  );
};

export const ActionButtonSection = registerComponent('ActionButtonSection', ActionButtonSectionInner, {styles});

declare global {
  interface ComponentTypes {
    ActionButtonSection: typeof ActionButtonSection
  }
}


