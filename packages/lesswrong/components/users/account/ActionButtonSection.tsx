import React, { ReactNode } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  blurb: {
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
    color: theme.palette.grey[800]
  },
});

type ActionButtonSectionProps = {
  buttonText: string;
  buttonProps: Partial<ComponentProps<typeof Components.EAButton>>;
  description: ReactNode;
  loading?: boolean;
  onClick: () => void;
  classes: ClassesType<typeof styles>;
};

const ActionButtonSection = ({
  buttonText,
  buttonProps,
  description,
  loading = false,
  onClick,
  classes,
}: ActionButtonSectionProps) => {
  const { EAButton, Loading } = Components;

  return (
    <div>
      <p className={classes.blurb}>{description}</p>
      <EAButton {...buttonProps} onClick={onClick}>
        {!loading ? buttonText : <Loading />}
      </EAButton>
    </div>
  );
};

const ActionButtonSectionComponent = registerComponent('ActionButtonSection', ActionButtonSection, {styles});

declare global {
  interface ComponentTypes {
    ActionButtonSection: typeof ActionButtonSectionComponent
  }
}

export default ActionButtonSectionComponent;
