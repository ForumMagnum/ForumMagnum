import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { JOB_AD_DATA } from "../../components/ea-forum/TargetedJobAd";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    lineHeight: "22px",
  },
  description: {
    maxWidth: 570,
    fontSize: 16,
    lineHeight: "22px",
    color: theme.palette.grey[700],
    margin: "10px 0",
    "& ul": {
      margin: 0,
    },
    "& li": {
      marginTop: 3,
    },
  },
  link: {
    color: theme.palette.primary.main,
  },
  hr: {
    marginTop: 20,
  }
});

// 'research-givewell': {
//   tagId: 'CGameg7coDgLbtgdH',//'hxRMaKvwGqPb43TWB',
//   logo: 'https://80000hours.org/wp-content/uploads/2017/03/GiveWell_square-160x160.jpg',
//   occupation: 'research',
//   feedbackLinkPrefill: 'Senior+Research+Associate+at+GiveWell',
//   bitlyLink: "https://efctv.org/3A16UNq",
//   role: 'Senior Research Associate',
//   org: 'GiveWell',
//   orgSlug: 'givewell',
//   salary: '$127k - $140k',
//   location: 'Remote (US-centric)',
//   getDescription: (classes: ClassesType) => <>
//     <div className={classes.description}>
//       <a href="https://www.givewell.org" target="_blank" rel="noopener noreferrer" className={classes.link}>
//         GiveWell
//       </a> is a nonprofit charity evaluator dedicated to finding the most cost-effective giving opportunities
//       in <span className={classes.link}>
//         <Components.HoverPreviewLink href="/topics/global-health-and-development" innerHTML="global health and development"/>
//       </span>.
//     </div>
//     <div className={classes.description}>
//       Ideal candidates:
//       <ul>
//         <li>Have a bachelor's degree (or higher) in a quantitative field such as economics, mathematics, or statistics or equivalent experience (~6 years)</li>
//         <li>Are passionate about helping to improve global health and alleviate global poverty as much as possible</li>
//         <li>Ask a lot of questions, and are curious, rather than defensive, when interrogating their own or others' work</li>
//       </ul>
//     </div>
//   </>
// },

const EmailJobInterestConfirmation = ({
  user,
  newInterestedJob,
  classes,
}: {
  user: UsersMinimumInfo | DbUser | null | undefined;
  newInterestedJob: string;
  classes: ClassesType;
}) => {
  const jobData = JOB_AD_DATA[newInterestedJob];
  const link = jobData.bitlyLink;
  const role = jobData.role;
  const org = jobData.org;
  const description = jobData.getDescription(classes);

  return (
    <div className={classes.root}>
      <div>
        Thank you for registering your interest in this role. We have passed on your EA Forum profile to the hiring
        manager, we would also encourage you to complete the full application <a href={link}>here</a>.
      </div>
      <hr className={classes.hr}/>
      <h2>
        {role} at {org}
      </h2>
      <div>{description}</div>
      <hr className={classes.hr}/>
    </div>
  );
};

const EmailJobInterestConfirmationComponent = registerComponent(
  "EmailJobInterestConfirmation",
  EmailJobInterestConfirmation,
  { styles }
);

declare global {
  interface ComponentTypes {
    EmailJobInterestConfirmation: typeof EmailJobInterestConfirmationComponent;
  }
}
