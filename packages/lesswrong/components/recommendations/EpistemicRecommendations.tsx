import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { smallPostStyles } from '../../themes/stylePiping';

export const highlightSimplifiedStyles = {
  '& img': {
    display:"none"
  },
  '& hr': {
    display: "none"
  }
}
const styles = (theme: ThemeType): JssStyles => ({
  recommendation: {
    display: "flex",
    marginBottom: 8,
    background: "white",
    boxShadow: "0 1px 5px rgb(0 0 0 / 10%)",
    '&:hover': {
      opacity: 1
    },
    '&:focus': {
      opacity: 1
    }
  },
  text: {
    padding: 12
  },
  title: {
    ...theme.typography.postStyle,
    fontSize: "1.6rem",
    marginRight: 15,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  snippet: {
    ...smallPostStyles(theme),
  },
  image: {
    width: 140,
    height: 140,
    // marginRight: 10,
    // "object-fit": "none"
  },
  author: {
    fontStyle: "italic",
    ...smallPostStyles(theme),
    fontSize: "1.2rem",
    color: theme.palette.grey[600]
  },
  readMore: {
    fontStyle: "italic",
    ...smallPostStyles(theme),
    display: "inline-block",
    fontSize: "1rem",
    color: theme.palette.grey[500],
    position: "relative",
    top: -1
  }
});

const links = [
  {
    image: "https://i.imgur.com/7eMhpY9.png",
    title: "Leave a Line of Retreat",
    snippet: "'Make sure,' I suggested, 'that you visualize what the world would be like if there are no souls, and what you would do about that. Don’t think about all the reasons that it can’t be that way; just accept it as a premise and then visualize the consequences.",
    url: "/posts/3XgYbghWruBMrPTAL/leave-a-line-of-retreat",
    author: "Eliezer Yudkowsky"
  },
  {
    image: "https://i.imgur.com/52NQrXw.png",
    title: "Write your Hypothetical Apostasy",
    snippet: "Here is a debiasing technique one might try: writing a hypothetical apostasy. Imagine, if you will, that the world's destruction is at stake and the only way to save it is for you to write a one-pager that convinces a jury that your cherished view is mistaken",
    url: "/collaborateOnPost?postId=KgqMPhMEBKcJoFoHo&key=f82eeb8fb40ee1cf3e4c3f6c893cd0",
    author: "Nick Bostrom"
  },
  {
    image: "https://imgur.com/ItXLARl.png",
    title: "\"Other people are wrong\" vs \"I am right\"",
    snippet: "I’ve recently been spending some time thinking about the rationality mistakes I’ve made in the past. Here’s an interesting one: I think I have historically been too hasty to go from “other people seem very wrong on this topic” to “I am right on this topic”.",
    url: "/posts/4QemtxDFaGXyGSrGD/other-people-are-wrong-vs-i-am-right",
    author: "Buck"
  },
  {
    image: "https://i.imgur.com/bG9Xc2A.png",
    title: "There's No Such Thing as a Tree (Phylogenetically)",
    snippet: "You’ve heard about how fish aren’t a monophyletic group? You’ve heard about carcinization, the process by which ocean arthropods convergently evolve into crabs? You say you get it? Sit down. Sit down. Shut up. Listen. You don’t know nothing yet.",
    url: "/posts/fRwdkop6tyhi3d22L/there-s-no-such-thing-as-a-tree-phylogenetically",
    author: "Eukaryote"
  },
  {
    image: "https://i.imgur.com/HFQNErP.png",
    title: "High-stakes alignment via adversarial training",
    snippet: "We used adversarial training to improve high-stakes reliability in a task (\"filter all injurious continuations of a story\") that we think is analogous to work that future AI safety engineers will need to do to reduce the risk of AI takeover.",
    url: "posts/A9tJFJY7DsGTFKKkh/high-stakes-alignment-via-adversarial-training-redwood",
    author: "DMZ"
  },  {
    image: "https://i.imgur.com/F3MfNjy.png",
    title: "Making Beliefs Pay Rent (in Anticipated Experiences)",
    snippet: "If there’s a foundational skill in the martial art of rationality, a mental stance on which all other technique rests, it might be this one: the ability to spot, inside your own head, psychological signs that you have a mental map of something, and signs that you don’t.",
    url: "/s/7gRSERQZbqTuLX5re/p/a7n8GdKiAZRX86T5A",
    author: "Eliezer Yudkowsky"
  },
  {
    image: "https://i.imgur.com/Tmss1G0.png",
    title: "Alignment Research Exercises",
    snippet: "It's currently hard to know where to start when trying to get better at thinking about alignment. So below I've listed a few dozen exercises which I expect to be helpful.",
    url: "/posts/kj37Hzb2MsALwLqWt/alignment-research-exercises",
    author: "Richard Ngo"
  },
  {
    image: "https://i.imgur.com/s41vmyY.png",
    title: "Babble challenge: 50 ways of getting to the moon",
    snippet: "Come up with 50 ways of sending something to the moon.\n\nIn less than 1 hour.\n\nI don’t care how stupid they are. My own list included 'Slingshot', 'Massive trampoline' and 'Bird with spacesuit.' What matters is that you actually hit 50.",
    url: "/posts/pDkZitYsJAwf8mHKJ/babble-challenge-50-ways-of-sending-something-to-the-moon",
    author: "JacobJacob"
  },
  {
    image: "https://imgur.com/OQDbK8v.png",
    title: "Principles Which Carry Over to the Next Paradigm",
    snippet: "I don’t know what the next paradigm will be, yet; the particulars of a proof or formulation of a problem might end up obsolete. But I look for principles which I expect will survive, even if the foundations shift beneath them.",
    url: "/posts/bmoQ2wy7Nd7EiJdpg/look-for-principles-which-will-carry-over-to-the-next",
    author: "Johnswentworth"
  },
  {
    image: "https://i.imgur.com/MMNbN9g.png",
    title: "Interactive Guide to Bayes Theorem",
    snippet: "Bayes' rule is the law of probability governing the strength of evidence - the rule saying how much to revise our probabilities (change our minds) when we learn a new fact or observe new evidence.",
    href: "https://arbital.com/p/bayes_rule/?l=1zq",
    author: "Eliezer Yudkowsky"
  },
]
  // {
  //   image: "",
  //   title: "Lies, Damn Lies, and Fabricated Options",
  //   snippet: "The seeming coherence of the imaginary world where gyroscopes don't balance and don't precess and don't resist certain kinds of motion is a product of my own ignorance, and of the looseness with which I am tracking how different facts fit together, and what the consequences of those facts are.",
  //   url: ""
  // }

export const EpistemicRecommendations = ({classes, title, start}: {
  classes: ClassesType,
  title: string,
  start: number
}) => {
  const { SingleColumnSection, SectionTitle, LWTooltip, SettingsButton, LoadMore } = Components 
  const [more, setMore] = useState(false)

  const linkComponent = link => {
    const component = <>
      <div className={classes.text}>
        <div className={classes.title}><div>{link.title}</div> <div className={classes.author}>{link.author}</div></div>
        <span className={classes.snippet}>{link.snippet}</span>
      </div>
      <img src={link.image} className={classes.image}/>
    </>

    if (link.url) {
      return <Link to={link.url} key={link.url} className={classes.recommendation}>
        {component}
      </Link>
    }

    if (link.href) {
      return <a href={link.href} className={classes.recommendation}>
        {component}
      </a>
    }
  }
  let newLinks = links

  if (start) { newLinks = links.slice(start, 10)}

  const renderedLinks = more ? newLinks : newLinks.slice(0,3)
 
  return <SingleColumnSection>
    <SectionTitle title={title || "Recommended for You" }>
      <LWTooltip title="Recommendations are algorithmically chosen from a hand-curated list. Posts are recommended to you based on your viewing history and the importance of the posts. Expect to see a mix of all-time classics and the best latest posts. Click here to see a detailed breakdown of the recommendation algorithm.">
        <SettingsButton showIcon={false} label="How we recommend posts"/>
      </LWTooltip>
    </SectionTitle>
    {renderedLinks.map(link =>linkComponent(link))}
    {!more && <div onClick={() => setMore(true)}>
      <LoadMore />
    </div>}
  </SingleColumnSection>;
}

const EpistemicRecommendationsComponent = registerComponent('EpistemicRecommendations', EpistemicRecommendations, {styles});

declare global {
  interface ComponentTypes {
    EpistemicRecommendations: typeof EpistemicRecommendationsComponent
  }
}

function highlightStyles(theme: ThemeType) {
  throw new Error('Function not implemented.');
}

