import classNames from "classnames";
import { registerComponent } from "../../lib/vulcan-lib/components";
import SimpleDivider from "../widgets/SimpleDivider";

const styles = (theme: ThemeType) => ({
  root: {
},
});

const DropdownDivider = ({className, classes}: {
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <SimpleDivider className={classNames(className, classes.root)} />
  );
}

export default registerComponent("DropdownDivider", DropdownDivider, {styles});
