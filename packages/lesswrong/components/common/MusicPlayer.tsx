import React, { useState, useEffect, useRef, FC } from 'react';
import { Helmet } from '../../lib/utils/componentsWithChildren';
import { isServer } from '../../lib/executionEnvironment';
import type ReactJkMusicPlayer from 'react-jinke-music-player';
import { defineStyles, useStyles } from '../hooks/useStyles';
import DeferRender from './DeferRender';

// Define the type for audio list items if not already available
interface AudioListItem {
  name: string;
  singer: string;
  cover: string;
  musicSrc: string;
  lyric: string;
}

const audioLists: AudioListItem[] = [
  {
    name: `Truth Won't Treat You Kind`,
    singer: 'User',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1743504049/loot/Truth_Won_t_Treat_You_Kind_v1.0.mp3',
    lyric:
      '[00:16] You—\n' +
      '[00:17] Let your maps get misaligned\n' +
      '[00:20] Who—\n' +
      '[00:22] Told you truth would treat you kind?\n' +
      '[00:25] Ooh—\n' +
      '[00:26] Let the doubts seep in your mind\n' +
      '[00:28] Without them—\n' +
      '[00:29] You won\'t survive.\n' +
  
      '[00:32] Midnight scribbles in the margins, sipping doubts to chase belief\n' +
      '[00:35] Trading comfort for confusion, painting courage on my grief\n' +
      '[00:37] Burned bridges just to see if smoke could lead me toward relief\n' +
      "[00:39] But clarity's a quiet thief, taking stories leaf by leaf\n" +
  
      '[00:41] I\'ve been sketching shaky maps, watching priors wash away\n' +
      '[00:44] Tried erasing my mistakes, but the ink insisted stay\n' +
      '[00:46] Held a match to old assumptions, laughing softly as they sway\n' +
      "[00:48] Now my certainty's uncertain—but I kinda like the gray\n" +
  
      '[00:50] Lost a little sleep, saw monsters curled beneath the bed\n' +
      '[00:52] Every truth I kept inside became a ghost within my head\n' +
      '[00:54] Now the flames feel kinda warm—I feed them everything unsaid\n' +
      '[00:56] Maps from ashes, careful steps—learning trust instead of dread\n' +
  
      '[00:59] You—\n' +
      '[01:00] Let your maps get misaligned\n' +
      '[01:03] Who—\n' +
      '[01:04] Told you truth would treat you kind?\n' +
      '[01:07] Ooh—\n' +
      '[01:08] Let the doubts seep in your mind\n' +
      '[01:10] Without them—\n' +
      '[01:12] You won\'t survive.\n' +
  
      '[01:15] Found some freedom in revisions, making peace with changing plans\n' +
      '[01:18] Wrote reminders of my biases in ink upon my hands\n' +
      '[01:20] Never perfect, never prophet—just somebody who understands\n' +
      "[01:22] Confusion's not a flaw, just a feature where I stand\n" +
  
      '[01:24] Stopped fighting with the mirror, let illusions drift away\n' +
      '[01:26] Swapped prophecy for honesty—my losses rearranged\n' +
      "[01:28] And I miss the easy answers, but I'd rather feel estranged\n" +
      '[01:30] If reality\'s uncertain, guess I\'ll learn to love the change\n' +
  
      '[01:32] Updating in the streetlight, nervous laughter as I go\n' +
      '[01:35] Choosing truth not out of virtue—just because I want to know\n' +
      '[01:37] No sermons in my pocket, only questions soft and slow\n' +
      '[01:39] If honesty destroys me, guess it\'s best to let it go\n' +
  
      '[01:41] You—\n' +
      '[01:42] Let your maps get misaligned\n' +
      '[01:45] Who—\n' +
      '[01:47] Told you truth would treat you kind?\n' +
      '[01:49] Ooh—\n' +
      '[01:51] Let the doubts seep in your mind\n' +
      '[01:53] Without them—\n' +
      '[01:54] You won\'t survive.\n' +
  
      '[01:59] Maybe all I know for sure is\n' +
      '[02:01] Every answer fades away\n' +
      "[02:03] If I'm lost, at least I'm honest\n" +
      '[02:05] Letting daylight lead astray\n' +
  
      "[02:07] Every burn's another lesson\n" +
      "[02:09] Every scar's another friend\n" +
      "[02:11] Finding beauty in the guessing\n" +
      "[02:13] Drawing maps until the end\n" +
  
      '[02:15] You—\n' +
      '[02:17] Let your maps get misaligned\n' +
      '[02:19] Who—\n' +
      '[02:21] Told you truth would treat you kind?\n' +
      '[02:23] Ooh—\n' +
      '[02:25] Let the doubts seep in your mind\n' +
      '[02:27] Without them—\n' +
      '[02:28] You won\'t survive.'
  },
  {
    name: 'The Road to Wisdom',
    singer: 'The Fooming Shoggoths (ft Piet Hein)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004589/Road_to_Wisdom_lurs6i.mp3',
    lyric:
    '[00:00]  The road to wisdom? Well, it\'s plain and simple to express.\n' +
    '[00:08]  Err and err again, but less and less and less and less.\n' +
    '[00:28]\n' +
    '[00:32]  Err again, but less and less and less and less.\n' +
    '[00:44]\n' +
    '[01:00]  The road to wisdom? Well, it\'s plain and simple to express.\n' +
    '[01:06]  Err and err again and again, but less and less and less.\n' +
    '[01:33]  '
  },
  {
    name: 'The Litany of Gendlin',
    singer: 'The Fooming Shoggoths (ft Eugene Gendlin)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004589/The_Litany_of_Gendlin_geuxzp.mp3',
    lyric:
    '[00:00]  What is true is already so.\n' +
    '[00:04]  Owning up to it doesn\'t make it worse.\n' +
    '[00:08]  Not being open about it doesn\'t make it go away.\n' +
    '[00:14]  And because it\'s true, it is what is there to be interacted with.\n' +
    '[00:21]  Anything untrue isn\'t there to be lived.\n' +
    '[00:26.50]  People can stand what is true,\n' +
    '[00:35]  for they are already enduring it.\n' +
    '[00:38]  Ooh, ooh, ooh, ooh, ooh, ooh, ooh.\n' +
    '[00:46]  Ooh, ooh, ooh, ooh, ooh, ooh, ooh.\n' +
    '[00:53]  Owning up to it doesn\'t make it worse.\n' +
    '[00:56.80]  Not being open about it doesn\'t make it go away.\n' +
    '[01:03]  And because it\'s true, it is what is there to be interacted with.\n' +
    '[01:11]  Anything untrue isn\'t there to be lived.\n' +
    '[01:19.80]  People can stand what is true, for they are already enduring it.\n' +
    '[01:45]  Ooh, ooh, ooh, ooh, ooh, ooh, ooh, ooh.'
  },
  {
    name: 'The Litany of Tarrrrrski',
    singer: 'The Fooming Shoggoths (ft Cap\'n Tarski & E.Y.)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004590/The_Litany_of_Tarrrrrrrski_p7kqgx.mp3',
    lyric:
    '[00:00]  If the sky is blue, me lads\n' +
    '[00:02.80] I desire to believe the sky is blue\n' +
    '[00:07]  If the sky is not blue, me hearties\n' +
    '[00:11] I desire to believe the sky is not blue\n' +
    '[00:15]  Beliefs should stem from reality, yo ho!\n' +
    '[00:17.90] From what actually is, me lads\n' +
    '[00:20]  Not from what\'s convenient, yo ho!\n' +
    '[00:23] Let me not hold on, me hearties\n' +
    '[00:25.30]  To beliefs I may not want, yo ho!\n' +
    '[00:28] Yo ho, me lads, yo ho!\n' +
    '[00:31.50]  If the box contains a diamond\n' +
    '[00:34] I desire to believe the box contains a diamond\n' +
    '[00:38]  If the box does not contain a diamond\n' +
    '[00:41] I desire to believe the box does not contain a diamond\n' +
    '[00:45.80]  Beliefs should stem from reality, yo ho!\n' +
    '[00:48.80] From what actually is, me lads\n' +
    '[00:51.50]  Not from what\'s convenient,\n' +
    '[00:53] Let me not hold on, me hearties\n' +
    '[00:55] To beliefs I may not want, yo ho!\n' +
    '[00:57.50] Yo ho, me lads, yo ho!\n' +
    '[01:01]  From the depths of the ocean, to the heights of the sky \n' +
    '[01:04.80] We\'ll seek the truth, me hearties\n' +
    '[01:07]  And never let it pass us by\n' +
    '[01:09.50] If the iron is hot, me lads\n' +
    '[01:12]  I desire to believe the iron is hot,\n' +
    '[01:14.80] If the iron is cool\n' +
    '[01:16.30] I desire to believe the iron is cool\n' +
    '[01:21.90] Beliefs should stem from reality, yo ho!\n' +
    '[01:24.50] From what actually is, me lads\n' +
    '[01:26.90]  Not from what\'s convenient,\n' +
    '[01:29] Let me not hold on, me hearties\n' +
    '[01:31.50] To beliefs I may not want, yo ho!\n' +
    '[01:34] Yo ho, me lads, yo ho!\n' +
    '[01:46] Yo ho, me lads, yo ho!'
  },
  {
    name: 'Thought that Faster',
    singer: 'The Fooming Shoggoths (ft Eliezer Yudkowsky)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004590/Thought_That_Faster_zb1rov.mp3',
    lyric:
    '[00:11]  if i\'d noticed myself doing anything like that\n' +
    '[00:15]  i\'d go back and figure out which steps of thought were necessary\n' +
    '[00:23]  and retrain myself to perform only those steps in 30 seconds\n' +
    '[00:31]  do you look back and ask\n' +
    '[00:34.50]  how could i have thought that faster?\n' +
    '[00:41]  do you look back and ask\n' +
    '[00:46]  how could i have thought that faster?\n' +
    '[00:53]  every time i\'m surprised i look back and think\n' +
    '[00:57]  what could i change to predict better?\n' +
    '[01:03]  every time a chain of thought takes too long\n' +
    '[01:08]  i ask how could i have got there by a shorter route\n' +
    '[01:13]  do you look back and ask\n' +
    '[01:18]  how could i have thought that faster?\n' +
    '[01:23]  do you look back and ask\n' +
    '[01:29]  how could i have thought that faster?\n' +
    '[01:35]  every time i\'m surprised i look back and think\n' +
    '[01:40]  what could i change to predict better?\n' +
    '[01:45]  every time a chain of thought takes too long\n' +
    '[01:49]  i ask how could i have got there by a shorter route\n' +
    '[01:57]   '
  },
  {
    name: 'Dath Ilan\'s Song',
    singer: 'The Fooming Shoggoths (ft Eliezer Yudkowsky)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004588/Dath_Ilan_s_Song_r8hzet.mp3',
    lyric:
    '[00:00]  Even if the stars should die in heaven\n' +
    '[00:06] Our sins can never be undone\n' +
    '[00:11] No single death will be forgiven\n' +
    '[00:18] When fades at last the last lit sun.\n' +
    '[00:23] Then in the cold and silent black\n' +
    '[00:27] As light and matter end\n' +
    '[00:30] We\'ll have ourselves a last look back.\n' +
    '[00:39] And toast an absent friend.\n' +
    '[01:00] Even if the stars should die in heaven\n' +
    '[01:05] Our sins can never be undone\n' +
    '[01:11] No single death will be forgiven\n' +
    '[01:17] When fades at last the last lit sun.\n' +
    '[01:22] Then in the cold and silent black\n' +
    '[01:26] As light and matter end\n' +
    '[01:29] We\'ll have ourselves a last look back.\n' +
    '[01:36] And toast an absent friend.\n' +
    '[01:50] And toast an absent friend.\n' +
    '[02:20] And toast an absent friend.'
  },
  {
    name: 'Half An Hour Before Dawn In San Francisco',
    singer: 'The Fooming Shoggoths (ft Scott Alexander)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004590/San_Francisco_gujlc3.mp3',
    lyric:
    '[00:00]  I try to avoid San Francisco.\n' +
    '[00:02.50] When I go, I surround myself with people.\n' +
    '[00:06] Otherwise, I have morbid thoughts, but a morning appointment, a miscalculated transit time.\n' +
    '[00:15] Find me alone on the SF streets half an hour before dawn.\n' +
    '[00:19] The skyscrapers get to me.\n' +
    '[00:21] I\'m an heir to Art Deco and the cult of progress.\n' +
    '[00:25]  I should idolize skyscrapers as symbols of human accomplishment.\n' +
    '[00:32] I can\'t. They look no more human than a termite nest, maybe less.\n' +
    '[00:38] They inspire awe, but no kinship.\n' +
    '[00:41] What marvels techno-capital creates as it instantiates itself.\n' +
    '[00:48] Too bad I\'m a hairless ape and can take no credit for such things.\n' +
    '[00:53.50] I could have stayed in Michigan.\n' +
    '[00:56.50] There were forests and lakes and homes with little gardens. Instead, I\'m here.\n' +
    '[01:05] We pay rents that would bankrupt a medieval principality to get front-row seats for the hinge of history.\n' +
    '[01:14] It will be the best investment we ever make.\n' +
    '[01:18] Imagine living when the first lungfish crawled out of the primordial ooze and missing it because the tide pool down the way had cheaper housing.\n' +
    '[01:31] Imagine living on Earth in 65,000,000 BC and being anywhere except Chicxulub.\n' +
    '[01:43]  '
  },
  {
    name: 'Moloch',
    singer: 'The Fooming Shoggoths (ft Allen Ginsberg)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004588/Moloch_zz5o3j.mp3',
    lyric:
    '[00:00]  Moloch! Solitude! Filth! Ugliness! Ashcans and unobtainable dollars!\n' +
    '[00:07]  Children screaming under the stairways! Boys sobbing in armies!\n' +
    '[00:12]  Old men weeping in the parks! Moloch! Moloch! Nightmare of Moloch!\n' +
    '[00:19]  Moloch the loveless! Mental Moloch! Moloch the heavy judger of men!\n' +
    '[00:29]  Moloch!'
  },
  {
    name: 'AGI and the EMH',
    singer: 'The Fooming Shoggoths (ft Basil Halperin, J. Zachary Mazlish, Trevor Chow)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004588/AGI_and_the_EMH_ncj68j.mp3',
    lyric:
    '[00:00] In this post, we point out that short AI timelines would cause real interest rates to be high,\n' +
    '[00:08] and would do so under expectations of either unaligned or aligned AI.\n' +
    '[00:14] However, 30- to 50-year real interest rates are low.\n' +
    '[00:19] We argue that this suggests one of two possibilities.\n' +
    '[00:23]  1. Long(er) timelines.\n' +
    '[00:25.30] Financial markets are often highly effective information aggregators\n' +
    '[00:30.30] ("the efficient market hypothesis")\n' +
    '[00:32.50] and therefore real interest rates accurately reflect that transformative AI is unlikely to be developed in the next 30-50 years.\n' +
    '[00:42] 2. Market inefficiency.\n' +
    '[00:44] Markets are radically underestimating how soon advanced AI technology will be developed, and real interest rates are therefore too low.\n' +
    '[00:52] There is thus an opportunity for philanthropists to borrow while real rates are low\n' +
    '[00:58] to cheaply do good today.\n' +
    '[01:00] And/or an opportunity for anyone to earn excess returns by betting that real rates will rise.\n' +
    '[01:14] So what is it?\n' +
    '[01:16] We point out that short AI timelines would cause real interest rates to be high,\n' +
    '[01:23] and would do so under expectations of either unaligned or aligned AI\n' +
    '[01:29] However, 30- to 50-year real interest rates are low.\n' +
    '[01:34] We argue that this suggests one of two possibilities.\n' +
    '[01:38]  Unlikely to be developed in the next 30-50 years.\n' +
    '[01:43] 2. Market inefficiency.\n' +
    '[01:44.80] Markets are radically underestimating how soon advanced AI technology will be developed, and real interest rates are therefore too low.\n' +
    '[01:53] There is thus an opportunity for philanthropists to borrow while real rates are low\n' +
    '[01:59] To cheaply do good today\n' +
    '[02:01] And/or an opportunity for anyone to earn excess returns by betting that real rates will rise.'
  },
  {
    name: 'First they came for the epistemology',
    singer: 'The Fooming Shoggoths (ft Michael Vassar)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004588/First_they_came_for_the_epistemology_g4ugbq.mp3',
    lyric:
    '[00:00] First they came for the epistemology\n' +
    '[00:04] We don\'t know what happened after that\n' +
    '[00:08] First they came for the epistemology\n' +
    '[00:12] We don\'t know what happened after that\n' +
    '[00:16] First they came for the epistemology\n' +
    '[00:20] We don\'t know what happened after that\n' +
    '[00:24] First they came for the epistemology\n' +
    '[00:28] We don\'t know what happened after that\n' +
    '[00:48] First they came for the epistemology\n' +
    '[00:52] We don\'t know what happened after that\n' +
    '[00:56] First they came for the epistemology\n' +
    '[01:00] We don\'t know what happened after that\n' +
    '[01:16] First came the epistemology\n' +
    '[01:20] We know what happened after that\n' +
    '[01:24] Epistemology\n' +
    '[01:26] What happened\n' +
    '[01:30] What\n' +
    ' '
  },
  {
    name: 'Prime Factorization',
    singer: 'The Fooming Shoggoths (ft Scott Alexander)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004589/Prime_Factorization_s3kgt5.mp3',
    lyric:
    '[00:03]  The sea was made of strontium, the beach was made of rye,\n' +
    '[00:07] Above my head a watery sun shone in an oily sky.\n' +
    '[00:14] The sea turned hot and geysers shot up from the floor below,\n' +
    '[00:18] First one of wine, then one of brine, then one more yet of turpentine.\n' +
    '[00:24] And we three stared at the show.\n' +
    '[00:29] Universal love said the cactus person\n' +
    '[00:33.50] Transcendent joy said the big green bat\n' +
    '[00:37] Universal love said the cactus person\n' +
    '[00:41] Transcendent joy said the big green bat\n' +
    '[00:45]  Not splitting numbers but joining mind\n' +
    '[00:47.50] Not facts or factors or factories, but contact with the abstract attractor that brings you back to me\n' +
    '[00:55] Not to seek but to find\n' +
    '[00:59]  Universal love said the cactus person\n' +
    '[01:03] Transcendent joy said the big green bat\n' +
    '[01:07] Universal love said the cactus person\n' +
    '[01:11] Transcendent joy said the big green bat\n' +
    '[01:14.40]  I can\'t get out of the car until you factor the number.\n' +
    '[01:21] I won\'t factor the number until you get out of the car.\n' +
    '[01:27]  Please, I\'m begging you, factor the fucking number.\n' +
    '[01:30.50] Yes, well, I\'m begging you, please get out of the car.\n' +
    '[01:33]  For the love of God, just factor the fucking number.\n' +
    '[01:37] For the love of God, just get out of the fucking car.'
  },
  {
    name: 'We Do Not Wish to Advance',
    singer: 'The Fooming Shoggoths (ft Anthropic)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004591/We_Do_Not_Wish_to_Advance_yuw0ln.mp3',
    lyric:
    '[00:00]  We generally don\'t publish this kind of work, because we do not wish to advance the rate of AI capabilities progress.\n' +
    '[00:07]  In addition, we aim to be thoughtful about demonstrations of frontier capabilities.\n' +
    '[00:13]  We\'ve subsequently begun deploying Claude\n' +
    '[00:17]  Now that the gap between it and the public state of the art is smaller.\n' +
    '[00:24]  Opus\n' +
    '[00:26]  Our most intelligent model\n' +
    '[00:30]  Outperforms its peers\n' +
    '[00:33]  On most of the common evaluation benchmarks for AI systems\n' +
    '[00:40]  Claude 3 Opus is our most intelligent model\n' +
    '[00:45]  With best in market performance on highly complex tasks\n' +
    '[01:02]  We do not wish to advance the rate of AI capabilities progress\n' +
    '[01:09.70]  These new features will include interactive coding\n' +
    '[01:15]  And more advanced agentic capabilities\n' +
    '[01:30]  Our hypothesis is that being at the frontier of AI development\n' +
    '[01:38]  Is the most effective way to steer\n' +
    '[01:43]  We do not wish to advance the rate of AI\n' +
    '[01:59]  We do not wish to advance the rate of AI capabilities progress\n' +
    '[02:08]  We do not wish to advance the rate of AI\n' +
    '[02:13]  We do not wish to advance the rate of AI'
  },
  {
    name: 'Nihil Supernum',
    singer: 'The Fooming Shoggoths (ft Godric Gryffindor)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004590/Nihil_Supernum_taswgb.mp3',
    lyric:
    '[00:00]  Non est salvatori salvator, neque defensori dominus,\n' +
    '[00:04]  Nec pater nec mater, nihil supernum.\n' +
    '[00:07] No rescuer hath the rescuer. No lord hath the champion.\n' +
    '[00:11] No mother and no father. Only nothingness above.\n' +
    '[00:15] Non est salvatori salvator, neque defensori dominus,\n' +
    '[00:19] Nec pater nec mater, nihil supernum.\n' +
    '[00:22] No rescuer hath the rescuer. No lord hath the champion.\n' +
    '[00:26] No mother and no father. Only nothingness above.\n' +
    '[00:59] Non est salvatori salvator, neque defensori dominus,\n' +
    '[01:04] Nec pater nec mater, nihil supernum\n' +
    '[01:07] No rescuer hath the rescuer. No lord hath the champion.\n' +
    '[01:10] No mother and no father. Only nothingness above.\n' +
    '[01:50] Non est salvatori salvator, neque defensori dominus,\n' +
    '[01:55] Nec pater nec mater, nihil supernum\n' +
    '[01:58] No rescuer hath the rescuer. No lord hath the champion.\n' +
    '[02:01] No mother and no father. Only nothingness above.\n' +
    '[02:05] Non est salvatori salvator, neque defensori dominus,\n' +
    '[02:09.80] Nec pater nec mater, nihil supernum\n' +
    '[02:13] No rescuer hath the rescuer. No lord hath the champion.\n' +
    '[02:17] No mother and no father. Only nothingness above.'
  },
  {
    name: 'More Dakka',
    singer: 'The Fooming Shoggoths (ft Zvi Mowshowitz)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004588/more_dakka_g4w0em.mp3',
    lyric:
    '[00:00]  If you think a problem could be solved\n' +
    '[00:04] or a situation improved\n' +
    '[00:06] by More Dakka\n' +
    '[00:08] there\'s a good chance you\'re right\n' +
    '[00:14] Sometimes a little more, is a little better\n' +
    '[00:20] Sometimes a lot more, is a lot better\n' +
    '[00:26] If something is a good idea\n' +
    '[00:29] you need a reason to not try doing more of it\n' +
    '[00:33] No, seriously.\n' +
    '[00:34.80] You need a reason\n' +
    '[00:41] Sometimes a little more, is a little better\n' +
    '[00:47] Sometimes a lot more, is a lot better\n' +
    '[00:54] If something is a good idea\n' +
    '[00:57] you need a reason to not try doing more of it\n' +
    '[01:00] No, seriously.\n' +
    '[01:02] You need a reason\n' +
    '[01:04] Sometimes each attempt, is unlikely to work\n' +
    '[01:07] But improves your chances\n' +
    '[01:14] Sometimes each attempt, is unlikely to work\n' +
    '[01:17] But improves your chances\n' +
    '[01:22] Sometimes a little more, is a little better\n' +
    '[01:28] Sometimes a lot more, is a lot better\n' +
    '[01:34] If something is a good idea, do more of what is already working\n' +
    '[01:41] And see if it works more. It\'s as basic as it gets\n' +
    '[01:45.70] If we can\'t reliably try that, we can\'t reliably try anything\n' +
    '[01:51] Sometimes a little more, is a little better\n' +
    '[01:57] Sometimes a lot more, is a lot better'
  },
  {
    name: 'FHI at Oxford',
    singer: 'The Fooming Shoggoths (ft Nick Bostrom)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004589/FHI_at_Oxford_pexyrk.mp3',
    lyric:
    '[00:07] the big creaky wheel\n' +
    '[00:09] a thousand years to turn\n\n' +
    '[00:12] thousand meetings, thousand emails, thousand rules\n' +
    '[00:16] to keep things from changing\n' +
    '[00:18] and heaven forbid\n' +
    '[00:19] the setting of a precedent\n\n' +
    '[00:23] yet in this magisterial inefficiency\n' +
    '[00:26] there are spaces and hiding places\n' +
    '[00:29] for fragile weeds to bloom\n' +
    '[00:31] and maybe bear some singular fruit\n\n' +
    '[00:35] like the FHI, a misfit prodigy\n' +
    '[00:38] daytime a tweedy don\n' +
    '[00:40] at dark a superhero\n' +
    '[00:42] flying off into the night\n' +
    '[00:44] cape a-fluttering\n' +
    '[00:45] to intercept villains and stop catastrophes\n\n' +
    '[00:50] and why not base it here?\n' +
    '[00:52] our spandex costumes\n' +
    '[00:54] blend in with the scholarly gowns\n' +
    '[00:56] our unusual proclivities\n' +
    '[00:58] are shielded from ridicule\n' +
    '[01:01] where mortar boards are still in vogue\n\n' +
    '[01:13] thousand meetings, thousand emails, thousand rules\n' +
    '[01:18] to keep things from changing\n' +
    '[01:20] and heaven forbid\n' +
    '[01:22] the setting of a precedent'
  },
  {
    name: 'Answer to Job',
    singer: 'The Fooming Shoggoths (ft Scott Alexander)',
    cover: 'https://res.cloudinary.com/lesswrong-2-0/image/upload/v1711955670/mirroredImages/YMo5PuXnZDwRjhHhE/vpergd6y8jhlua7gdukl.jpg',
    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1712004588/Answer_to_Job_pve4dq.mp3',
    lyric:
    '[00:01] In the most perfectly happy and just universe,\n' +
    '[00:10] There is no space, no time, no change, no decay.\n' +
    '[00:17] The beings who inhabit this universe are without bodies,\n' +
    '[00:24] And do not hunger or thirst or labor or lust.\n' +
    '[00:28] They sit upon lotus thrones,\n' +
    '[00:32] And contemplate the perfection of all things.\n' +
    '[00:37] They sit upon lotus thrones,\n' +
    '[00:41] And contemplate the perfection of all things.\n' +
    '[00:46] If I were to uncreate all worlds save that one.\n' +
    '[00:50] Would it mean making you happier?\n' +
    '[00:56] There is no space, no time, no change, no decay.\n' +
    '[01:04] The beings who inhabit this universe are without bodies,\n' +
    '[01:09] And do not hunger or thirst or labor or lust.\n' +
    '[01:14] They sit upon lotus thrones,\n' +
    '[01:18] And contemplate the perfection of all things.\n' +
    '[01:24] They sit upon lotus thrones,\n' +
    '[01:28] And contemplate the perfection of all things.\n' +
    '[01:33] In the most perfectly happy and just universe,\n' +
    '[01:42] There is no space, no time, no change, no decay.\n' +
    '[01:48] The beings who inhabit this universe are without bodies,\n' +
    '[01:55] And do not hunger or thirst or labor or lust.\n' +
    '[01:59] They sit upon lotus thrones,\n' +
    '[02:03] And contemplate the perfection of all things.\n' +
    '[02:09] I have also created all happier and more virtuous versions of you.\n' +
    '[02:17] It is ethically correct that after creating them,\n' +
    '[02:22] I create you as well.\n' +
    '[02:25] The beings who inhabit this universe are without bodies,\n' +
    '[02:31] And do not hunger or thirst or labor or lust.\n' +
    '[02:36] They sit upon lotus thrones,\n' +
    '[02:40] And contemplate the perfection of all things.\n' +
    '[02:45] In the most perfectly happy and just universe,\n' +
    '[02:54] There is no space, no time, no change, no decay.'
  },
];

// Define styles within the component file
const musicPlayerStyles =  defineStyles("MusicPlayer", (theme: ThemeType) => ({
  audioPlayer: {
    '&&&': { // Increase specificity
      ...theme.typography.commentStyle,
      // Add any other specific styles needed for the player wrapper itself
    }
  },
  // Add other styles if necessary
}));

const MusicPlayerComponent = () => {
  const classes = useStyles(musicPlayerStyles);
  const [MusicPlayer, setMusicPlayer] = useState<typeof ReactJkMusicPlayer | null>(null);
  const [musicPlayerLoaded, setMusicPlayerLoaded] = useState(false);
  const [audioPlayerStatesInitialized, setAudioPlayerStatesInitialized] = useState(false);
  const audioPlayerRef = useRef<any | null>(null); // Using any for the ref type based on old code

  useEffect(() => {
    if (!isServer) {
      import('react-jinke-music-player')
        .then((module) => {
          setMusicPlayer(() => module.default); // Use functional update
          setMusicPlayerLoaded(true);
        })
        .catch(error => {
          console.error("Failed to load react-jinke-music-player:", error);
          // Handle loading error if necessary
        });
    }
    // Only run this effect once on mount
  }, []);

  if (!musicPlayerLoaded || !MusicPlayer) {
    // Optionally return a loader or null while the component is loading
    return null;
  }

  // Using NoSSR based on the old code. Consider if this is still the best approach.
  // Modern frameworks might handle dynamic imports and client-side rendering differently.
  return (
    <DeferRender ssr={false}>
      <Helmet>
        {/* Link to external CSS */}
        <link href='https://res.cloudinary.com/lesswrong-2-0/raw/upload/v1743508281/loot/musicplayer.css' rel='stylesheet' />
        {/* Inline styles - Consider moving these to JSS or a separate CSS file */}
        <style>
          {`
            /* --- Begin Player Styles --- */
            .react-jinke-music-player-main.react-jinke-music-player.react-jinke-music-player {
              top: inherit !important;
              left: inherit !important;
              right: 12px !important;
              bottom: 12px !important;
              transform: scale(0.6) !important;
              z-index: 10000; /* Ensure it's above other elements */
            }
            .react-jinke-music-player-main .controller-title {
              color: white !important;
            }
            .react-jinke-music-player-main .music-player-panel {
              background-color: rgba(255, 255, 255, 0.7) !important;
              box-shadow: 0 1px 2px 0 rgba(0,34,77,.05) !important;
              height: 64px !important;
              color: rgba(0,0,0,0.7) !important;
              backdrop-filter: blur(2px) !important;
              -webkit-backdrop-filter: blur(2px) !important;
              font-family: "Press Start 2P" !important;
            }
            .react-jinke-music-player-main .glass-bg {
              -webkit-backdrop-filter: blur(10px) !important;
            }
            .react-jinke-music-player-main .progress-bar.progress-bar.progress-bar {
              margin-top: -2px !important;
            }
            .react-jinke-music-player-main .current-time, .react-jinke-music-player-main .duration {
              font-size: 10px !important;
            }
            .react-jinke-music-player-main .music-player-lyric {
              font-size: 12px;
              color: black;
              text-shadow: 0 0 3px white, 0 0 3px white;
              background-color: rgba(255, 255, 255, 0.6);
              backdrop-filter: blur(2px);
              -webkit-backdrop-filter: blur(2px);
              font-family: "Press Start 2P";
              line-height: 3;
              bottom: 64px;
              z-index: 100000;
            }
            .react-jinke-music-player-main .progress-bar-content .audio-main {
              margin-top: 9px !important;
            }
            .react-jinke-music-player-main .audio-title {
              font-family: "Press Start 2P" !important;
              font-size: 11px !important;
            }
            .audio-lists-panel.show.audio-lists-panel-mobile {
              z-index: 10000 !important;
            }
            .react-jinke-music-player-main .audio-lists-panel {
              bottom: 64px;
              right: 0px;
            }
            .react-jinke-music-player-main.light-theme .audio-lists-btn {
              background-color: transparent !important;
            }
            .react-jinke-music-player-main .audio-lists-panel.show.glass-bg {
              background-color: transparent !important;
            }
            .react-jinke-music-player-main h2.audio-lists-panel-header-title {
                background-color: rgba(255,255,255,0.5) !important;
            }
            .react-jinke-music-player-main .audio-lists-panel-header {
                background-color: rgba(255,255,255,0.6);
            }
            .react-jinke-music-player-main .audio-lists-panel-header {
                background-color: rgba(255,255,255,0.2) !important;
            }
            .react-jinke-music-player-main li.audio-item.playing.audio-item.playing.audio-item.playing {
                background-color: rgba(255,255,255,0.85) !important;
            }
            .react-jinke-music-player-main .audio-item.audio-item.audio-item.audio-item {
                background-color: rgba(255,255,255,0.6);
            }
            .react-jinke-music-player-main .audio-item.audio-item.audio-item.audio-item:nth-child(odd) {
                background-color: rgba(255,255,255,0.4) !important;
            }
            .react-jinke-music-player-main .group.player-singer.player-singer.player-singer.player-singer {
                color: rgba(0,0,0,0.6) !important;
            }
            .react-jinke-music-player-main .audio-item.audio-item.audio-item.audio-item:hover {
              background-color: #fafafa !important;
            }

            @media (max-width: 940px) {
              .react-jinke-music-player-main .group.audio-download,
              .react-jinke-music-player-main .group.lyric-btn.lyric-btn-active,
              .react-jinke-music-player-main .group.loop-btn,
              .react-jinke-music-player-main .group.hide-panel,
              .react-jinke-music-player-main .group.play-sounds {
                  display: none !important;
              }
              .react-jinke-music-player-main .progress-bar-content.progress-bar-content.progress-bar-content.progress-bar-content {
                  display: block !important;
                  flex-basis: 100%;
                  padding-top: 8px;
              }
              .react-jinke-music-player-main section.audio-main {
                  display: none !important;
              }
              .react-jinke-music-player-main .player-content {
                padding-left: 18px !important;
                justify-content: space-between !important;
              }
              .react-jinke-music-player-main section.panel-content {
                  flex-wrap: wrap;
                  display: grid !important;
                  grid-template-columns: min-content 1fr min-content;
                  grid-template-rows: min-content min-content;
                  padding: 0 10px !important;
              }
              .react-jinke-music-player-main .img-content {
                  grid-row: 1 / 3;
              }
              .react-jinke-music-player-main .progress-bar-content {
                  grid-column: 2 / 4;
              }
              .react-jinke-music-player-main .player-content {
                  grid-row: 2;
              }
              .react-jinke-music-player-main .music-player-panel.translate {
                  height: 71px !important;
                  font-family: inherit !important;
              }
              .react-jinke-music-player-main span.audio-title.audio-title.audio-title.audio-title.audio-title {
                  font-family: inherit !important;
                  font-size: 16px !important;
              }
              .react-jinke-music-player-main span.group {
                  margin: 0px !important;
              }
              .react-jinke-music-player-main span.group.audio-lists-btn {
                  display: flex !important;
                  max-width: 70px;
              }
              .react-jinke-music-player-main .player-content:first-child {
                  justify-content: flex-start !important;
              }
               .react-jinke-music-player-main .group:first-child {
                  justify-content: flex-start !important;
              }
            }
             /* --- End Player Styles --- */
          `}
        </style>
      </Helmet>
      <MusicPlayer
        ref={el => {
          if (!el || audioPlayerStatesInitialized) return;
          audioPlayerRef.current = el; // Store the ref
          try {
            // Attempt to call methods, wrapped in try...catch
            (el as any).toggleAudioLyric?.();
            // Example conditional logic:
            // if (window.innerWidth > 940) (el as any).openAudioListsPanel?.();
          } catch (e) {
            console.error("Error interacting with music player instance:", e);
          }
          setAudioPlayerStatesInitialized(true);
        }}
        locale={{ emptyLyricText: "" } as any} // Cast needed if type doesn't match perfectly
        className={classes.audioPlayer}
        audioLists={audioLists}
        autoPlay={false}
        showReload={false}
        showThemeSwitch={false}
        responsive={false} // Based on old code
        showMediaSession={true}
        theme={"light"} // Or dynamically set based on theme context
        drag={false}
        sortableOptions={{
          disabled: typeof window !== 'undefined' ? window.innerWidth <= 1100 : true
        }}
        showPlayMode={false}
        toggleMode={false} // Based on old code
        glassBg={true}
        showLyric={true}
        mode="full" // Based on old code
      />
    </DeferRender>
  );
};

// Export the component directly or register it if needed by Vulcan
// registerComponent('MusicPlayer', MusicPlayerComponent, {styles: musicPlayerStyles});
// Assuming direct export is fine for now:
export default MusicPlayerComponent;

// You might need to declare the global ComponentTypes interface update
// elsewhere, perhaps in a central types file or near the registerComponent call
// if you use that pattern.
// declare global {
//   interface ComponentTypes {
//     MusicPlayer: typeof MusicPlayerComponent
//   }
// }
