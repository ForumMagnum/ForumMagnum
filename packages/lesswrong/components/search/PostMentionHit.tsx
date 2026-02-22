import { registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  root: {
},
  icon: {
    width: 16,
    height: 16,
    marginRight: 6,
    transform: "translateY(4px)",
  },
});

const PostMentionHit = ({hit, classes}: {
  hit: SearchPost,
  classes: ClassesType<typeof styles>,
}) => {
  const icon = "📃";
  return (
    <span className={classes.root}>
      {icon} <span>{hit.title}</span>
    </span>
  );
}

export default registerComponent(
  "PostMentionHit",
  PostMentionHit,
  {styles},
);


