import classNames from "classnames";
import { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  root: {
},
});

const DropdownMenu = ({children, className, classes}: {
  children: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classNames(classes.root, className)}>
      {children}
    </div>
  );
}

export default registerComponent("DropdownMenu", DropdownMenu, {styles});
