import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  text: {
    ...theme.typography.body2,
    ...theme.typography.postStyle
  }
});

export interface CoreReadingCollection {
  title: string,
  subtitle?: string,
  small?: boolean,
  id: string,
  userId: string,
  summary: string,
  hideSummaryOnMobile?: boolean,
  imageId?: string,
  imageWidth?: number,
  imageUrl?: string,
  color: string,
  big?: boolean,
  url: string,
  firstPost?: {
    postId: string,
    postTitle: string,
    postUrl: string
  }
}

const coreReadingCollections: Array<CoreReadingCollection> = 
  [
    {
      title: "Rationality: A-Z",
      subtitle: 'Also known as "The Sequences"',
      id: "dummyId",
      userId: "nmk3nLpQE89dMRzzN",
      summary: `<div>
        <p>
          How can we think better on purpose? <em>Why</em> should we think better on purpose?<br/>
          For two years Eliezer Yudkowsky wrote a blogpost a day, braindumping thoughts on rationality, ambition and artificial intelligence. Those posts were edited into this introductory collection, recommended reading for all Lesswrong users.
        </p>
      </div>`,
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657767459/mississippi-compass_gwqjvs.png",
      color: "#B1D4B4",
      url: '/rationality',
    },
    {
      title: "The Sequences Highlights",
      id: "dummyId4",
      userId: "nmk3nLpQE89dMRzzN",
      summary: `<div>
        <p>LessWrong can be kind of intimidating - there's a lot of concepts to learn. We recommend getting started with the Highlights, a collection of 50 top posts from Eliezer's Sequences.</p>
        <p>A day or two read, covering the foundations of rationality.</p>
        </div>`,
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_crop,g_custom/c_fill,dpr_auto,q_auto,f_auto,g_auto:faces,w_auto,h_280/sequences/rdl8pwokejuqyxipg6vx",
      color: "#757AA7",
      url: "/highlights",
    },
    {
      title: "Harry Potter and the Methods of Rationality",
      id: "dummyId3",
      userId: "nmk3nLpQE89dMRzzN",
      // subtitle: "Fiction by Eliezer Yudkowsky",
      summary: `<div>
        <p>What if Harry Potter was a scientist? What would you do if the universe had magic in it? <br/>A story that conveys many rationality concepts, making them more visceral and emotionally compelling.</div>`,
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657774172/DALL_E_2022-07-13_21.49.04_-_11_year_old_wizard_boy_with_short_messy_black_hair_and_glasses_standing_upright_looking_intently_at_the_camera_casting_a_question_spell_glowing_wh_l1ls1k.png",
      color: "#757AA7",
      url: "/hpmor",
    },
    {
      title: "The Codex",
      // subtitle: "Collected writings of Scott Alexander",
      id: "dummyId2",
      userId: "XgYW5s8njaYrtyP7q",
      summary: "<div>Essays by Scott Alexander exploring science, medicine, philosophy, futurism, and politics. (There's also one about hallucinatory cactus people but it's not representative).</div>",
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657688283/codex_u7ptgt.png",
      color: "#88ACB8",
      url: "/codex",
    },
    {
      title: "Best of LessWrong",
      // subtitle: "Assorted authors",
      id: "dummyId5",
      userId: "nmk3nLpQE89dMRzzN",
      summary: "<div>Each December, the LessWrong community reviews the best posts from the previous year, and votes on which ones have stood the tests of time.</div>",
      // summary: "<div>Each December, the LessWrong community reviews the best posts from the previous year, and votes on which of them have stood the tests of time.</div>",
      imageUrl: "https://res.cloudinary.com/lesswrong-2-0/image/upload/v1657778273/DALL_E_2022-07-13_22.57.43_-_Books_and_emerald_compass_displayed_on_a_pedastal_aquarelle_painting_by_da_vinci_and_thomas_shaler_magic_the_gathering_concept_art_as_digital_art_ayufzo.png",
      color: "#757AA7",
      url: "/bestoflesswrong",
    }
  ]

const LWCoreReadingInner = ({classes}: {
  minimal?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { SingleColumnSection, CollectionsItem } = Components

  return <SingleColumnSection className={classes.root}>
    {coreReadingCollections.map(collection => <CollectionsItem key={collection.id} collection={collection}/>)}
  </SingleColumnSection>
}

export const LWCoreReading = registerComponent("LWCoreReading", LWCoreReadingInner, {styles});

declare global {
  interface ComponentTypes {
    LWCoreReading: typeof LWCoreReading
  }
}
