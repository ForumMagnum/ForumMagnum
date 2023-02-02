import React, {useState, useEffect} from 'react';
import { useCurrentUser } from '../common/withUser';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useQuery, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import Radio from "@material-ui/core/Radio";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  postColumn: {
    position: "absolute",
    top: 0, bottom: 0,
    paddingTop: 96,
    paddingBotton: 300,
    width: "50%",
    overflow: "scroll",
  },
  firstPost: {
    left: 0,
  },
  secondPost: {
    right: 0,
  },
  comparisonBallot: {
    position: "absolute",
    
    padding: 32,
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.normal,
    boxShadow: theme.palette.boxShadow.lwCard,
    
    bottom: 0,
    height: 250,
    
    left: "50%",
    width: 500, marginLeft: -250,
  },
  question: {
    ...theme.typography.commentStyle,
  },
  prompt: {
    fontSize: 15,
  },
  comparisonScale: {
    marginLeft: 64,
  },
  comparisonRadioButton: {
  },
  buttonNext: {
    background: theme.palette.greyAlpha(0.2),
    display: "flex",
    justifyContent: "flex-end",
  },
});

interface PostComparisonBallot {
  whichHappierItWasWritten: number|null
  whichHappierToHaveRead: number|null
};
const initialPostComparisonBallot = {
  whichHappierItWasWritten: null,
  whichHappierToHaveRead: null,
};

interface PostComparison {
  firstPost: PostsPage
  secondPost: PostsPage
}

const HeadToHeadPostComparisonPage = ({classes}: {
  classes: ClassesType
}) => {
  const { Loading, WrappedLoginForm, PostsPage } = Components;
  const currentUser = useCurrentUser();
  const [currentComparison,setCurrentComparison] = useState<PostComparison|null>(null);

  const { data, loading, refetch, error } = useQuery(gql`
    query HeadToHeadComparison {
      headToHeadPostComparison {
        firstPost {
          ...PostsPage
        }
        secondPost {
          ...PostsPage
        }
      }
    }
    ${fragmentTextForQuery("PostsPage")}
  `);
  
  useEffect(() => {
    if (data && !currentComparison) {
      console.log("Updating comparison");
      setCurrentComparison(data.headToHeadPostComparison);
    }
    if (data && !loading && currentComparison && (
        (data.headToHeadPostComparison?.firstPost === currentComparison.firstPost
        || data.headToHeadPostComparison?.secondPost === currentComparison.secondPost)
      )
    ) {
      console.log("Fetching next comparison");
      refetch();
    }
  }, [currentComparison, data, loading, refetch]);
  
  if (!currentUser) {
    return (<WrappedLoginForm />);
  }
  
  if (!currentComparison) {
    return <div className={classes.root}>
      <Loading/>
    </div>
  }
  
  const onSubmitBallot = (ballot: PostComparisonBallot) => {
    if(data
      && (data?.headToHeadPostComparison?.firstPost !== currentComparison.firstPost
        || data?.headToHeadPostComparison?.secondPost !== currentComparison.secondPost
      )
    ) {
      setCurrentComparison(data.headToHeadPostComparison);
    } else {
      setCurrentComparison(null);
    }
    void refetch();
  }

  const {firstPost,secondPost} = currentComparison;
  
  return <div className={classes.root}>
    <div className={classNames(classes.postColumn, classes.firstPost)}>
      <PostsPage
        post={firstPost as any}
        hidePostKarma={true}
        refetch={()=>{}}
      />
    </div>
    <div className={classNames(classes.postColumn, classes.secondPost)}>
      <PostsPage
        post={secondPost as any}
        hidePostKarma={true}
        refetch={()=>{}}
      />
    </div>
    <div className={classes.comparisonBallot}>
      <PostComparisonForm
        onSubmit={onSubmitBallot}
        classes={classes}
      />
    </div>
  </div>
}

const PostComparisonForm = ({onSubmit, classes}: {
  onSubmit: (ballot: PostComparisonBallot)=>void
  classes: ClassesType
}) => {
  const [ballot,setBallot] = useState<PostComparisonBallot>(initialPostComparisonBallot);
  
  return <div>
    <div className={classes.question}>
      <div className={classes.prompt}>Which of these posts are you more glad that it was written and published?</div>
      <ComparisonScale
        value={ballot.whichHappierItWasWritten}
        setValue={(newValue)=>setBallot({...ballot, whichHappierItWasWritten: newValue})}
        classes={classes}
      />
    </div>
    
    <div className={classes.question}>
      <div className={classes.prompt}>Which of these posts are you more glad that you spent time reading it?</div>
      <ComparisonScale
        value={ballot.whichHappierToHaveRead}
        setValue={(newValue)=>setBallot({...ballot, whichHappierToHaveRead: newValue})}
        classes={classes}
      />
    </div>
    
    <Button
      onClick={() => {
        onSubmit(ballot);
        setBallot(initialPostComparisonBallot);
      }}
      className={classes.buttonNext}
    >
      Next
    </Button>
  </div>
}

const ComparisonScale = ({value, setValue, classes}: {
  value: number|null,
  setValue: (newValue: number|null)=>void,
  classes: ClassesType
}) => {
  const possibleValues=[-2,-1,1,2];
  
  return <div className={classes.comparisonScale}>
    Left
    {possibleValues.map(v => <Radio
      key={v}
      checked={v===value}
      onChange={(ev,checked) => {
        if (checked) setValue(v);
      }}
      className={classes.comparisonRadioButton}
    />)}
    Right
  </div>
}


const HeadToHeadPostComparisonPageComponent = registerComponent("HeadToHeadPostComparisonPage", HeadToHeadPostComparisonPage, {styles});

declare global {
  interface ComponentTypes {
    HeadToHeadPostComparisonPage: typeof HeadToHeadPostComparisonPageComponent
  }
}
