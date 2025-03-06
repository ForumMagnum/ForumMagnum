import React, { ReactNode } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components.tsx';
import EAButton from "@/components/ea-forum/EAButton";
import { Loading } from "@/components/vulcan-core/Loading";

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
  buttonProps: Partial<Omit<ComponentProps<typeof Components.EAButton>, "onClick">>;
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
  return (
    <div>
      <div className={classes.blurb}>{description}</div>
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

export {
  ActionButtonSectionComponent as ActionButtonSection
}
