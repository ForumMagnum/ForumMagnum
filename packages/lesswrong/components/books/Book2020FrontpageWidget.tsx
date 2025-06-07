import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import LoginPopup from "../users/LoginPopup";
import BookCheckout from "../review/BookCheckout";
import Book2020Animation from "./Book2020Animation";
import ContentStyles from "../common/ContentStyles";
import Row from "../common/Row";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const UsersCurrentUpdateMutation = gql(`
  mutation updateUserBook2020FrontpageWidget($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersCurrent
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 50,
    marginLeft: 'auto',
    marginRight: 'auto',
    position: "relative",
    width: "100%",
    zIndex: theme.zIndexes.frontpageBooks,
    [theme.breakpoints.down('md')]: {
      width: '100%',
      maxWidth: 765,
      overflow: 'unset',
    },
    [theme.breakpoints.down('lg')]: {
      left: 0,
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 20,
      marginBottom: 0
    }
  },
  heading: {
    [theme.breakpoints.down('xs')]: {
      fontSize: '2.2rem !important',
      marginTop: '110px !important',
      textShadow: `
        0 0 5px ${theme.palette.background.pageActiveAreaBackground},
        0 0 10px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 20px ${theme.palette.background.pageActiveAreaBackground},
        0 0 5px ${theme.palette.background.pageActiveAreaBackground},
        0 0 10px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 20px ${theme.palette.background.pageActiveAreaBackground}
      `, 
    }
  },
  secondaryHeading: {
    marginTop: '-16px',
    fontStyle: 'italic',
    fontWeight: 'normal',
    [theme.breakpoints.down('xs')]: {
      textShadow: `
        0 0 5px ${theme.palette.background.pageActiveAreaBackground},
        0 0 10px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 20px ${theme.palette.background.pageActiveAreaBackground},
        0 0 5px ${theme.palette.background.pageActiveAreaBackground},
        0 0 10px ${theme.palette.background.pageActiveAreaBackground}, 
        0 0 20px ${theme.palette.background.pageActiveAreaBackground}
      `,  
    }
  },
  bookExplanation: {
    float: 'right',
    textAlign: "right",
    [theme.breakpoints.down('md')]: {
      paddingRight: 0
    }
  },
  learnMore: {
    ...theme.typography.commentStyle,
    display: 'flex',
    alignItems: 'center',
    height: 36,
    fontSize: '1.2rem',
    marginLeft: 16,
    marginRight: 16,
    whiteSpace: "nowrap",
    marginTop: -7
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  closeButton: {
    ...theme.typography.commentStyle,
    position: 'absolute',
    right: 0,
    top: -8,
    fontSize: '1rem',
    color: theme.palette.icon.dim2,
    cursor: 'pointer',
  },
  descriptionText: {
    fontSize: '0.96em',
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
  sectionTwo: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  }
})

const Book2020FrontpageWidget = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [updateUser] = useMutation(UsersCurrentUpdateMutation);
  const { openDialog } = useDialog();

  if (currentUser?.hideFrontpageBook2020Ad) return null

  const hideClickHandler = async () => {
    if (currentUser) {
      await updateUser({
        variables: {
          selector: { _id: currentUser._id },
          data: {
            hideFrontpageBook2020Ad: true
          }
        }
      })
    } else {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose}/>
      });
    }
  }

  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const BookMarketingText = ({title, subtitle, description, buttons}: {
    title: string;
    subtitle: string;
    description: string | React.JSX.Element;
    buttons: React.JSX.Element;
  }) => {
    return <ContentStyles contentType="post" className={classes.bookExplanation}>
      <div className={classes.closeButton} onClick={hideClickHandler}>X</div>
      <h1 className={classes.heading}>
        {title}
      </h1>
      <h4 className={classes.secondaryHeading}>
        {subtitle}
      </h4>
      <p className={classes.descriptionText}>
        {description}
      </p>
      <div className={classes.buttonRow}>
        {buttons}
      </div>
    </ContentStyles>
  }

  return (
    <div className={classes.root}>
      <Book2020Animation>
        <BookMarketingText 
          title={"The Carving of Reality"} 
          subtitle={"Best of LessWrong, Volume III"}
          description={<>Each year, the LessWrong community votes on which posts were most valuable. We've compiled the winners of the third Annual Review into an anthology of four books. <span className={classes.sectionTwo}>The essays explore questions like <em>"When is AGI likely to transform the world?"</em>, <em>"What are the limits of Bayesian reasoning?"</em>, and <em>"Why exactly is civilization so dysfunctional?"</em></span></>}
          buttons={<>
            <Link className={classes.learnMore} to="/posts/Rck5CvmYkzWYxsF4D/book-launch-the-carving-of-reality-best-of-lesswrong-vol-iii">
              Learn More
            </Link>
            <BookCheckout link={"https://www.amazon.com/Carving-Reality-Essays-LessWrong-Community/dp/B0C95MJJBK"}/>
          </>}
        />
      </Book2020Animation>
    </div>
  )
}


export default registerComponent('Book2020FrontpageWidget', Book2020FrontpageWidget, { styles });


