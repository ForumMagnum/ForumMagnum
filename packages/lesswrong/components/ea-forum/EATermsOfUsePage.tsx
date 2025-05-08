import React, { FC, PropsWithChildren } from "react"
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { CENTRAL_COLUMN_WIDTH } from "../posts/PostsPage/PostsPage";
import { Link } from "../../lib/reactRouterWrapper";

const PADDING = 15;

const styles = (theme: ThemeType) => ({
  root: {
    maxWidth: CENTRAL_COLUMN_WIDTH,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: theme.spacing.unit * 3,
    "& .Typography-body1": {
      paddingBottom: PADDING,
      "& a": {
        color: theme.palette.primary.main,
      },
    },
  },
  bold: {
    fontWeight: "bold",
  },
  title: {
    textAlign: "center",
    fontSize: "2.2em",
    marginTop: 40,
  },
  lastUpdated: {
    fontWeight: "bold",
    fontSize: "1.2em",
    textAlign: "center",
    margin: 30 - PADDING,
    padding: PADDING,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  heading: {
    paddingTop: 20,
    fontWeight: "bold",
  },
  subheading: {
    textDecoration: "underline",
  },
  bullet: {
    marginRight: 15,
  },
  subbullet: {
    margin: "0 15px 0 25px",
  },
});

const ExternalLink: FC<PropsWithChildren<{href: string}>> = ({href, children}) =>
  <a href={href} target="_blank" rel="noreferrer">{children}</a>

const EATermsOfUsePageInner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const {Typography} = Components;
  return (
    <div className={classes.root}>
      <Typography variant="display1" className={classes.title}>Effective Ventures Foundation - Terms of Use – EA FORUM ADDENDUM</Typography>
      <Typography variant="body1" className={classes.lastUpdated}>Last Updated: October 31, 2022</Typography>
      <Typography variant="body1">
        Welcome to Effective Ventures Foundation! EVF operates a variety of online websites and resources, including those made available at <ExternalLink href="https://ev.org/">https://ev.org/</ExternalLink> and any other sites or applications containing a link to EVF’s General Terms of Use (“<span className={classes.bold}>Terms</span>”, currently available at: <ExternalLink href="https://www.effectivealtruism.org/terms-and-conditions">https://www.effectivealtruism.org/terms-and-conditions</ExternalLink>).
      </Typography>
      <Typography variant="body1">
        The Terms are entered into by you and EVF and in addition to this Addendum, it governs your access to and use of the EA Forum. Please read the Terms and this Addendum carefully before you access or use the EA Forum.
      </Typography>
      <Typography variant="body1">
        By accessing or using the EA Forum, you confirm that you accept these Terms, this Addendum and all policies referenced in them and you agree to comply with them. If you do not agree to the Terms and/or this Addendum, and all other policies referred to in them, then you must not access or use any EVF Sites (as defined in the Terms).
      </Typography>
      <Typography variant="body1">
        If this Addendum contradicts with the Terms, then the relevant provisions of this Addendum take precedence.
      </Typography>
      <Typography variant="body1" className={classes.heading} id="generalAccessTerms">
        <span className={classes.bullet}>1.</span>  General Access Terms
      </Typography>
      <Typography variant="body1" id="rulesOfUseOrGuides">
        <span className={classes.subbullet}>1.1</span> <span className={classes.subheading}>Rules of Use or Guides</span>. Where the Terms refer to rules of use or guides, such reference includes the Guides to the Norms on the Forum (the “<span className={classes.bold}>Guide</span>”). Please take a few moments to review the Guide (<Link to="/posts/yND9aGJgobm5dEXqF/guide-to-norms-on-the-forum">https://forum.effectivealtruism.org/posts/yND9aGJgobm5dEXqF/guide-to-norms-on-the-forum</Link>). If there is a conflict between the Guide, and the Terms, the Terms will apply.
      </Typography>
      <Typography variant="body1" className={classes.heading} id="yourContent">
        <span className={classes.bullet}>2.</span> Your Content
      </Typography>
      <Typography variant="body1" id="licenseToYourContent">
        <span className={classes.subbullet}>2.1</span> <span className={classes.subheading}>License to Your Content</span>. Subject to Section 2.2, when you create an Account, or upload or post Your Content to the EA Forum, you grant to us, our third-party service providers (including our Content Management Provider (as defined below)), and our other visitors and users, a royalty-free, perpetual, irrevocable, worldwide, nonexclusive, non sub-licensable, license to exercise the Licensed Rights in Your Content to reproduce and share Your Content, in whole or in part, for any purposes and to produce, reproduce and share Adapted Material for any purposes. You also irrevocably waive any “moral rights” or other rights with respect to attribution of authorship or integrity of materials for Your Content. When we make public use of Your Content, we will, where practical, use good faith efforts to credit you as the original author of Your Content. (Licensed Rights and Adapted Material are as defined in the <ExternalLink href="https://creativecommons.org/licenses/by/4.0/">Creative Commons — Attribution 4.0 International — CC BY 4.0</ExternalLink> License).
      </Typography>
      <Typography variant="body1">
        <span className={classes.subbullet}>2.2</span> When you upload Your Content to the EA Forum, you agree that you are doing so in accordance with, and on the basis that it will be made available to users on, the terms of the Creative Commons — Attribution 4.0 International — <ExternalLink href="https://creativecommons.org/licenses/by/4.0/">Creative Commons — Attribution 4.0 International — CC BY 4.0</ExternalLink>. The licences of Your Content provided under this Section 2.2 are irrevocable and royalty-free. The provisions regarding moral rights in Section 2.1 apply to Your Content uploaded to the EA Forum.
      </Typography>
      <Typography variant="body1" id="feedback">
        <span className={classes.subbullet}>2.3</span> <span className={classes.subheading}>Feedback</span>. Any feedback, suggestions, testimonials, reviews, questions, comments, ideas, notes, concepts, and other similar information that you provide to us in any form or media that relates to us, our third-party service providers (including our Content Management Providers), our visitors or users, or the EVF Sites (collectively, “<span className={classes.bold}>Feedback</span>”) will be considered non-confidential and non-proprietary to you. For the avoidance of any doubt, you hereby grant us a royalty-free, perpetual, irrevocable, worldwide, transferable, nonexclusive, non sub-licensable license to exercise the Licensed Rights (as defined in the CC BY 4.0) in such Feedback for any purpose. We are not obligated to (a) use your Feedback in any way; (b) maintain any Feedback in confidence; (c) pay any compensation for any Feedback; or (d) respond to any Feedback. The term “Feedback” does not include any personally identifiable information, and all Feedback we request from you will be collected on an anonymous basis.
      </Typography>
      <Typography variant="body1" id="monitoring">
        <span className={classes.subbullet}>2.4</span> <span className={classes.subheading}>Monitoring</span>. We may, but have no obligation to, monitor, edit or remove Your Content that we determine violates the Terms (including Section 7 of the Terms (Restrictions)), the Intellectual Property Rights of any person, any applicable Law, or the Guide. Our policies and procedures concerning our monitoring, editing, and removal practices are further explained in the Guide.
      </Typography>
    </div>
  );
}

export const EATermsOfUsePage = registerComponent('EATermsOfUsePage', EATermsOfUsePageInner, {styles})

declare global {
  interface ComponentTypes {
    EATermsOfUsePage: typeof EATermsOfUsePage
  }
}
