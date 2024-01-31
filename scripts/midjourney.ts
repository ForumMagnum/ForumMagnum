import { imagine_key, openai_key, openai_org } from './keys.ts'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: openai_key,
  organization: openai_org
})

const llm_prompt = (essay: string) => `
Please generate 5 phrases, each 1 to 7 words long. They should describe simple concrete objects and  will go in this instruction for an image prompt: "Aquarelle book cover inspired by topographic river maps and mathematical diagrams and equations. [BLANK]. Fade to white"

Some examples for other essays would be:
* "Coins and shaking hands"
* "A magnifying glass"
* "A tree with people gathered around"

They should not be things like:
* A scientist understanding a new topic [too abstract]
* The logo of an old internet forum [too generic]

They should be phrases such that I can use this as a prompt to illustrate the following essay, by being concrete objects that are visual metaphors for the idea of the essay.

Please format your response as a JSON list.

===

${essay}`

const essays = [`Rationalism Before the Sequences, by Eric Raymond

I'm here to tell you a story about what it was like to be a rationalist decades before the Sequences and the formation of the modern rationalist community.  It is not the only story that could be told, but it is one that runs parallel to and has important connections to Eliezer Yudkowsky's and how his ideas developed.

My goal in writing this essay is to give the LW community a sense of the prehistory of their movement.  It is not intended to be "where Eliezer got his ideas"; that would be stupidly reductive.  I aim more to exhibit where the drive and spirit of the Yudkowskian reform came from, and the interesting ways in which Eliezer's formative experiences were not unique.

My standing to write this essay begins with the fact that I am roughly 20 years older than Eliezer and read many of his sources before he was old enough to read.  I was acquainted with him over an email list before he wrote the Sequences, though I somehow managed to forget those interactions afterwards and only rediscovered them while researching for this essay. In 2005 he had even sent me a book manuscript to review that covered some of the Sequences topics.

My reaction on reading "The Twelve Virtues of Rationality" a few years later was dual. It was a different kind of writing than the book manuscript - stronger, more individual, taking some serious risks.  On the one hand, I was deeply impressed by its clarity and courage.  On the other hand, much of it seemed very familiar, full of hints and callbacks and allusions to books I knew very well.

Today it is probably more difficult to back-read Eliezer's sources than it was in 2006, because the body of more recent work within his reformation of rationalism tends to get in the way.  I'm going to attempt to draw aside that veil by talking about four specific topics: General Semantics, analytic philosophy, science fiction, and Zen Buddhism.

Before I get to those specifics, I want to try to convey that sense of what it was like.  I was a bright geeky kid in the 1960s and 1970s, immersed in a lot of obscure topics often with an implicit common theme: intelligence can save us!  Learning how to think more clearly can make us better! But at the beginning I was groping as if in a dense fog, unclear about how to turn that belief into actionable advice.

Sometimes I would get a flash of light through the fog, or at least a sense that there were other people on the same lonely quest. A bit of that sense sometimes drifted over USENET, an early precursor of today's Internet fora. More often than not, though, the clue would be fictional; somebody's imagination about what it would be like to increase intelligence, to burn away error and think more clearly.

When I found non-fiction sources on rationality and intelligence increase I devoured them.  Alas, most were useless junk. But in a few places I found gold.  Not by coincidence, the places I found real value were sources Eliezer would later draw on. I'm not guessing about this, I was able to confirm it first from Eliezer's explicit reports of what influenced him and then via an email conversation.

Eliezer and I were not unique.  We know directly of a few others with experiences like ours. There were likely dozens of others we didn't know - possibly hundreds - on parallel paths, all hungrily seeking clarity of thought, all finding largely overlapping subsets of clues and techniques because there simply wasn't that much out there to be mined.

One piece of evidence for this parallelism besides Eliezer's reports is that I bounced a draft of this essay off Nancy Lebovitz, a former LW moderator who I've known personally since the 1970s.  Her instant reaction?  "Full of stuff I knew already."

Around the time Nancy and I first met, some years before Eliezer Yudkowsky was born, my maternal grandfather gave me a book called "People In Quandaries". It was an introduction to General Semantics. I don't know, because I didn't know enough to motivate the question when he was alive, but I strongly suspect that granddad was a member of one of the early GS study groups, probably the same one that included Robert Heinlein (they were near neighbors in Southern California in the early 1940s).

General Semantics is going to be a big part of my story.  Twelve Virtues speaks of "carrying your map through to reflecting the territory"; this is a clear, obviously intentional callback to a central GS maxim that runs "The map is not the territory; the word is not the thing defined."

I'm not going to give a primer on GS here.  I am going to affirm that it rocked my world, and if the clue in Twelve Virtues weren't enough Eliezer has reported in no uncertain terms that it rocked his too.  It was the first time I encountered really actionable advice on the practice of rationality.

Core GS formulations like cultivating consciousness of abstracting, remembering the map/territory distinction, avoiding the verb "to be" and the is-of-identity, that the geometry of the real world is non-Euclidean, that the logic of the real world is non-Aristotelian; these were useful.  They helped.  They reduced the inefficiency of my thinking.

For the pre-Sequences rationalist, those of us stumbling around in that fog, GS was typically the most powerful single non-fictional piece of the available toolkit.  After the millennium I would find many reflections of it in the Sequences.

This is not, however, meant to imply that GS is some kind of supernal lost wisdom that all rationalists should go back and study.  Alfred Korzybski, the founder of General Semantics, was a man of his time, and some of the ideas he formulated in the 1930s have not aged well. Sadly, he was an absolutely terrible writer; reading "Science and Sanity", his magnum opus, is like an endless slog through mud with occasional flashes of world-upending brilliance.

If Eliezer had done nothing else but give GS concepts a better presentation, that would have been a great deal. Indeed, before I read the Sequences I thought giving GS a better finish for the modern reader was something I might have to do myself someday - but Eliezer did most of that, and a good deal more besides, folding in a lot of sound thinking that was unavailable in Korzybski's day.

When I said that Eliezer's sources are probably more difficult to back-read today than they were in 2006, I had GS specifically in mind. Yudkowskian-reform rationalism has since developed a very different language for the large areas where it overlaps GS's concerns.  I sometimes find myself in the position of a native Greek speaker hunting for equivalents in that new-fangled Latin; usually present but it can take some effort to bridge the gap.

Next I'm going to talk about some more nonfiction that might have had that kind of importance if a larger subset of aspiring rationalists had known enough about it.  And that is the analytic tradition in philosophy.

I asked Eliezer about this and learned that he himself never read any of what I would consider core texts: C.S. Peirce's epoch-making 1878 paper "How To Make Our Ideas Clear", for example, or W.V. Quine's "Two Dogmas of Empiricism". Eliezer got their ideas through secondary sources.  How deeply pre-Sequences rationalists drew directly from this well seems to be much more variable than the more consistent theme of early General Semantics exposure.

However: even if filtered through secondary sources, tropes originating in analytic philosophy have ended up being central in every formulated version of rationalism since 1900, including General Semantics and Yudkowskian-reform rationalism. A notable one is the program of reducing philosophical questions to problems in language analysis, seeking some kind of flaw in the map rather than mysterianizing the territory.  Another is the definition of "truth" as predictive power over some range of future observables.

But here I want to focus on a subtler point about origins rather than ends: these ideas were in the air around every aspiring rationalist of the last century, certainly including both myself and the younger Eliezer.  Glimpses of light through the fog...

This is where I must insert a grumble, one that I hope is instructive about what it was like before the Sequences.  I'm using the term "rationalist" retrospectively, but those among us who were seeking a way forward and literate in formal philosophy didn't tend to use that term of ourselves at the time.  In fact, I specifically avoided it, and I don't believe I was alone in this.

Here's why. In the history of philosophy, a "rationalist" is one who asserts the superiority of a-priori deductive reasoning over grubby induction from mere material facts. The opposing term is "empiricist", and in fact Yudkowskian-reform "rationalists" are, in strictly correct terminology, skeptical empiricists.  

Alas, that ship has long since sailed.  We're stuck with "rationalist" as a social label now; the success of the Yudkowskian reform has nailed that down. But it's worth remembering that in this case not only is our map not the territory, it's not even immediately consistent with other equally valid maps.

Now we get to the fun part, where I talk about science fiction.

SF author Greg Bear probably closed the book on attempts to define science fiction as a genre in 1994 when he said "the branch of fantastic literature which affirms the rational knowability of the universe". It shouldn't be surprising, then, that ever since the Campbellian Revolution in 1939 invented modern science fiction there has been an important strain in it of fascination with rationalist self-improvement.

I'm not talking about transhumanism here.  The idea that we might, say, upload to machines with vastly greater computational capacity is not one that fed pre-Yudkowskian rationalism, because it wasn't actionable.  No; I'm pointing at more attainable fictions about learning to think better, or discovering a key that unlocks a higher level of intelligence and rationality in ourselves.  "Ultrahumanist" would be a better term for this, and I'll use it in the rest of this essay.

I'm going to describe one such work in some detail, because (a) wearing my SF-historian hat I consider it a central exemplar of the ultrahumanist subgenre, and (b) I know it had a large personal impact on me.

"Gulf", by Robert A. Heinlein, published in the October–November 1949 Astounding Science Fiction.  A spy on a mission to thwart an evil conspiracy stumbles over a benign one - people who call themselves "Homo Novis" and have cultivated techniques of rationality and intelligence increase, including an invented language that promotes speed and precision of thought.  He is recruited by them, and a key part of his training involves learning the language.

At the end of the story he dies while saving the world, but the ostensible plot is not really the point.  It's an excuse for Heinlein to play with some ideas, clearly derived in part from General Semantics, about what a "better" human being might look and act like - including, crucially, the moral and ethical dimension.  One of the tests the protagonist doesn't know he's passing is when he successfully cooperates in gentling a horse.

The most important traits of the new humans are that (a) they prize rationality under all circumstances - to be accepted by them you have to retain clear thinking and problem-solving capability even when you're stressed, hungry, tired, cold, or in combat; and (b) they're not some kind of mutation or artificial superrace. They are human beings who have chosen to pool their efforts to make themselves more reliably intelligent.

There was a lot of this sort of GS-inspired ultrahumanism going around in Golden Age SF between 1940 and 1960.  Other proto-rationalists may have been more energized by other stories in that current.  Eliezer remembers and acknowledges "Gulf" as an influence but reports having been more excited by "The World of Null-A" (1946). Isaac Asimov's "Foundation" novels (1942-1953) were important to him as well even though there was not much actionable in them about rationality at the individual level.

As for me, "Gulf" changed the direction of my life when I read it sometime around 1971.  Perhaps I would have found that direction anyway, but...teenage me wanted to be homo novis. More, I wanted to deserve to be homo novis.  When my grandfather gave me that General Semantics book later in the same decade, I was ready.

That kind of imaginative fuel was tremendously important, because we didn't have a community.  We didn't have a shared system. We didn't have hubs like Less Wrong and Slate Star Codex. Each of us had to bootstrap our own rationality technique out of pieces like General Semantics, philosophical pragmatism, the earliest most primitive research on cognitive biases, microeconomics, and the first stirrings of what became evolutionary psych.

Those things gave us the materials. Science fiction gave us the dream, the desire that it took to support the effort of putting it together and finding rational discipline in ourselves.

Last I'm going to touch on Zen Buddhism. Eliezer likes to play with the devices of Zen rhetoric; this has been a feature of his writing since Twelve Virtues.  I understood why immediately, because that attraction was obviously driven by something I myself had discovered decades before in trying to construct my own rationalist technique.

Buddhism is a huge, complex cluster of religions. One of its core aims is the rejection of illusions about how the universe is. This has led to a rediscovery, at several points in its development, of systematic theories aimed at stripping away attachments and illusions. And not just that; also meditative practices intended to shift the practitioner into a mental stance that supports less wrongness.

If you pursue this sort of thing for more than three thousand years, as Buddhists have been doing, you're likely to find some techniques that actually do help you pay better attention to reality - even if it is difficult to dig them out of the surrounding religious encrustations afterwards.

One of the most recent periods of such rediscovery followed the 18th-century revival of Japanese Buddhism by Hakuin Ekaku. There's a fascinating story to be told about how Euro-American culture imported Zen in the early 20th century and refined it even further in the direction Hakuin had taken it, a direction scholars of Buddhism call "ultimatism".  I'm not going to reprise that story here, just indicate one important result of it that can inform a rationalist practice.

Here's the thing that Eliezer and I and other 20th-century rationalists noticed; Zen rhetoric and meditation program the brain for epistemic skepticism, for a rejection of language-driven attachments, for not just knowing that the map is not the territory but feeling that disjunction.

Somehow, Zen rhetoric's ability to program brains for epistemic skepticism survives not just disconnection from Japanese culture and Buddhist religious claims, but translation out of its original language into English. This is remarkable - and, if you're seeking tools to loosen the grip of preconceptions and biases on your thinking, very useful.

Alfred Korzybski himself noticed this almost as soon as good primary sources on Zen were available in the West, back in the 1930s; early General Semantics speaks of "silence on the objective level" in a very Zen-like way.

No, I'm not saying we all need to become students of Zen any more than I think we all need to go back and immerse ourselves in GS. But co-opting some of Zen's language and techniques is something that Eliezer definitely did. And I did, and other rationalists before the Yudkowskian reformation tended to find their way to.

If you think about all these things in combination - GS, analytic philosophy, Golden Age SF, Zen Buddhism - I think the roots of the Yudkowskian reformation become much easier to understand.  Eliezer's quest and the materials he assembled were not unique.  His special gift was the same ambition as Alfred Korzybski's; to form from what he had learned a teachable system for becoming less wrong. And, of course, the intellectual firepower to carry that through - if not perfectly, at least well enough to make a huge difference.

If nothing else, I hope this essay will leave you feeling grateful that you no longer have to do a decades-long bootstrapping process the way Eliezer and Nancy and I and others like us had to in the before times.  I doubt any of us are sorry we put in the effort, but being able to shortcut a lot of it is a good thing.

Some of you, recognizing my name, will know that I ended up changing the world in my own way a few years before Eliezer began to write the Sequences.  That this ensued after long struggle to develop a rationalist practice is not coincidence; if you improve your thinking hard enough over enough time I suspect it's difficult to avoid eventually getting out in front of people who aren't doing that.

That's what Eliezer did, too. In the long run, I rather hope that his reform movement will turn out to have been more important than mine.

Selected sources follow.  The fiction list could have been a lot longer, but I filtered pretty strongly for works that somehow addressed useful models of individual rationality training. Marked with * are those Eliezer explicitly reports he has read.

Huikai, Wumen: "The Gateless Barrier" (1228)

Peirce, Charles Sanders: "How To Make Our Ideas Clear" (1878)

Korzybski, Alfred: "Science and Sanity" (1933)

Chase, Stuart: "The Tyranny of Words" (1938)

Hayakawa, S. I: "Language in Thought and Action" (1939) *

Russell, Bertrand: "A History of Western Philosophy" (1945)

Orwell, George: "Politics and the English Language" (1946) *

Johnson, Wendell: "People in Quandaries: The Semantics of Personal Adjustment" (1946)

Van Vogt, A. E: "The World of Null-A" (1946) *

Heinlein, Robert Anson: "Gulf" (1949) *

Quine, Willard Van Orman: "Two Dogmas of Empiricism" (1951)

Heinlein, Robert Anson: "The Moon Is A Harsh Mistress" (1966) *

Williams, George: "Adaptation and Natural Selection" (1966) *

Pirsig, Robert M.: "Zen and the Art of Motorcycle Maintenance" (1974) *

Benares, Camden: "Zen Without Zen Masters" (1977)

Smullyan, Raymond: "The Tao is Silent" (1977) *

Hill, Gregory & Thornley, Kerry W.: "Principia Discordia (5th ed.)" (1979) *

Hofstadter, Douglas: "Gödel, Escher, Bach: An Eternal Golden Braid" (1979) *

Feynman, Richard: "Surely You're Joking, Mr. Feynman!" (1985) *

Pearl, Judea: "Probabilistic Reasoning in Intelligent Systems" (1988) *

Stiegler, Marc: "David's Sling" (1988) *

Zindell, David: "Neverness" (1988) *

Williams, Walter John: "Aristoi" (1992) *

Tooby & Cosmides: "The Adapted Mind: Evolutionary Psychology and the Generation of Culture" (1992) *

Wright, Robert: "The Moral Animal" (1994) *

Jaynes, E.T.: "Probability Theory: The Logic of Science" (1995) *

The assistance of Nancy Lebovitz, Eliezer Yudowsky, Jason Azze, and Ben Pace is gratefully acknowledged. Any errors or inadvertent misrepresentations remain entirely the author's responsibility.`,

`This piece starts to make the case that we live in a remarkable century, not just a remarkable era. Previous pieces in this series talked about the strange future that could be ahead of us eventually (maybe 100 years, maybe 100,000).

Summary of this piece:

We're used to the world economy growing a few percent per year. This has been the case for many generations.
However, this is a very unusual situation. Zooming out to all of history, we see that growth has been accelerating; that it's near its historical high point; and that it's faster than it can be for all that much longer (there aren't enough atoms in the galaxy to sustain this rate of growth for even another 10,000 years).
The world can't just keep growing at this rate indefinitely. We should be ready for other possibilities: stagnation (growth slows or ends), explosion (growth accelerates even more, before hitting its limits), and collapse (some disaster levels the economy).
The times we live in are unusual and unstable. We shouldn't be surprised if something wacky happens, like an explosion in economic and scientific progress, leading to technological maturity. In fact, such an explosion would arguably be right on trend.

For as long as any of us can remember, the world economy has grown1 a few percent per year, on average. Some years see more or less growth than other years, but growth is pretty steady overall.2 I'll call this the Business As Usual world.

In Business As Usual, the world is constantly changing, and the change is noticeable, but it's not overwhelming or impossible to keep up with. There is a constant stream of new opportunities and new challenges, but if you want to take a few extra years to adapt to them while you mostly do things the way you were doing them before, you can usually (personally) get away with that. In terms of day-to-day life, 2019 was pretty similar to 2018, noticeably but not hugely different from 2010, and hugely but not crazily different from 1980.3

If this sounds right to you, and you're used to it, and you picture the future being like this as well, then you live in the Business As Usual headspace. When you think about the past and the future, you're probably thinking about something kind of like this:


Business As Usual
I live in a different headspace, one with a more turbulent past and a more uncertain future. I'll call it the This Can't Go On headspace. Here's my version of the chart:


This Can't Go On4
Which chart is the right one? Well, they're using exactly the same historical data - it's just that the Business As Usual chart starts in 1950, whereas This Can't Go On starts all the way back in 5000 BC. "This Can't Go On" is the whole story; "Business As Usual" is a tiny slice of it.


Growing at a few percent a year is what we're all used to. But in full historical context, growing at a few percent a year is crazy. (It's the part where the blue line goes near-vertical.)

This growth has gone on for longer than any of us can remember, but that isn't very long in the scheme of things - just a couple hundred years, out of thousands of years of human civilization. It's a huge acceleration, and it can't go on all that much longer. (I'll flesh out "it can't go on all that much longer" below.)

The first chart suggests regularity and predictability. The second suggests volatility and dramatically different possible futures.

One possible future is stagnation: we'll reach the economy's "maximum size" and growth will essentially stop. We'll all be concerned with how to divide up the resources we have, and the days of a growing pie and a dynamic economy will be over forever.

Another is explosion: growth will accelerate further, to the point where the world economy is doubling every year, or week, or hour. A Duplicator-like technology (such as digital people or, as I’ll discuss in future pieces, advanced AI) could drive growth like this. If this happens, everything will be changing far faster than humans can process it.

Another is collapse: a global catastrophe will bring civilization to its knees, or wipe out humanity entirely, and we'll never reach today's level of growth again.

Or maybe something else will happen.

Why can't this go on?
A good starting point would be this analysis from Overcoming Bias, which I'll give my own version of here:

Let's say the world economy is currently getting 2% bigger each year.5 This implies that the economy would be doubling in size about every 35 years.6
If this holds up, then 8200 years from now, the economy would be about 3*1070 times its current size.
There are likely fewer than 1070 atoms in our galaxy,7 which we would not be able to travel beyond within the 8200-year time frame.8
So if the economy were 3*1070 times as big as today's, and could only make use of 1070 (or fewer) atoms, we'd need to be sustaining multiple economies as big as today's entire world economy per atom.
8200 years might sound like a while, but it's far less time than humans have been around. In fact, it's less time than human (agriculture-based) civilization has been around.

Is it imaginable that we could develop the technology to support multiple equivalents of today's entire civilization, per atom available? Sure - but this would require a radical degree of transformation of our lives and societies, far beyond how much change we've seen over the course of human history to date. And I wouldn't exactly bet that this is how things are going to go over the next several thousand years. (Update: for people who aren't convinced yet, I've expanded on this argument in another post.)

It seems much more likely that we will "run out" of new scientific insights, technological innovations, and resources, and the regime of "getting richer by a few percent a year" will come to an end. After all, this regime is only a couple hundred years old.

(This post does a similar analysis looking at energy rather than economics. It projects that the limits come even sooner. It assumes 2.3% annual growth in energy consumption (less than the historical rate for the USA since the 1600s), and estimates this would use up as much energy as is produced by all the stars in our galaxy within 2500 years.9)

Explosion and collapse
So one possible future is stagnation: growth gradually slows over time, and we eventually end up in a no-growth economy. But I don't think that's the most likely future.

The chart above doesn't show growth slowing down - it shows it accelerating dramatically. What would we expect if we simply projected that same acceleration forward?

Modeling the Human Trajectory (by Open Philanthropy’s David Roodman) tries to answer exactly this question, by “fitting a curve” to the pattern of past economic growth.10 Its extrapolation implies infinite growth this century. Infinite growth is a mathematical abstraction, but you could read it as meaning: "We'll see the fastest growth possible before we hit the limits."

In The Duplicator, I summarize a broader discussion of this possibility. The upshot is that a growth explosion could be possible, if we had the technology to “copy” human minds - or something else that fulfills the same effective purpose, such as digital people or advanced enough AI.

In a growth explosion, the annual growth rate could hit 100% (the world economy doubling in size every year) - which could go on for at most ~250 years before we hit the kinds of limits discussed above.11 Or we could see even faster growth - we might see the world economy double in size every month (which we could sustain for at most 20 years before hitting the limits12), or faster.

That would be a wild ride: blindingly fast growth, perhaps driven by AIs producing output beyond what we humans could meaningfully track, quickly approaching the limits of what's possible, at which point growth would have to slow.

In addition to stagnation or explosive growth, there's a third possibility: collapse. A global catastrophe could cut civilization down to a state where it never regains today's level of growth. Human extinction would be an extreme version of such a collapse. This future isn't suggested by the charts, but we know it's possible.

As Toby Ord’s The Precipice argues, asteroids and other "natural" risks don't seem likely to bring this about, but there are a few risks that seem serious and very hard to quantify: climate change, nuclear war (particularly nuclear winter), pandemics (particularly if advances in biology lead to nasty bioweapons), and risks from advanced AI.

With these three possibilities in mind (stagnation, explosion and collapse):

We live in one of the (two) fastest-growth centuries in all of history so far. (The 20th and 21st.)
It seems likely that this will at least be one of the ~80 fastest-growing centuries of all time.13
If the right technology comes along and drives explosive growth, it could be the #1 fastest-growing century of all time - by a lot.
If things go badly enough, it could be our last century.
So it seems like this is a quite remarkable century, with some chance of being the most remarkable. This is all based on pretty basic observations, not detailed reasoning about AI (which I will get to in future pieces).

Scientific and technological advancement
It’s hard to make a simple chart of how fast science and technology are advancing, the same way we can make a chart for economic growth. But I think that if we could, it would present a broadly similar picture as the economic growth chart.

A fun book I recommend is Asimov's Chronology of Science and Discovery. It goes through the most important inventions and discoveries in human history, in chronological order. The first few entries include "stone tools," "fire," "religion" and "art"; the final pages include "Halley's comet" and "warm superconductivity."

An interesting fact about this book is that 553 out of its 654 pages take place after the year 1500 - even though it starts in the year 4 million BC. I predict other books of this type will show a similar pattern,14 and I believe there were, in fact, more scientific and technological advances in the last ~500 years than the previous several million.15


In a previous piece, I argued that the most significant events in history seem to be clustered around the time we live in, illustrated with this timeline. That was looking at billions-of-years time frames. If we zoom in to thousands of years, though, we see something similar: the biggest scientific and technological advances are clustered very close in time to now. To illustrate this, here's a timeline focused on transportation and energy (I think I could've picked just about any category and gotten a similar picture).
So as with economic growth, the rate of scientific and technological advancement is extremely fast compared to most of history. As with economic growth, presumably there are limits at some point to how advanced technology can become. And as with economic growth, from here scientific and technological advancement could:

Stagnate, as some are concerned is happening.
Explode, if some technology were developed that dramatically increased the number of "minds" (people, or digital people, or advanced AIs) pushing forward scientific and technological development.16
Collapse due to some global catastrophe.
Neglected possibilities
I think there should be some people in the world who inhabit the Business As Usual headspace, thinking about how to make the world better if we basically assume a stable, regular background rate of economic growth for the foreseeable future.

And some people should inhabit the This Can’t Go On headspace, thinking about the ramifications of stagnation, explosion or collapse - and whether our actions could change which of those happens.

But today, it seems like things are far out of balance, with almost all news and analysis living in the Business As Usual headspace.

One metaphor for my headspace is that it feels as though the world is a set of people on a plane blasting down the runway:


We're going much faster than normal, and there isn't enough runway to do this much longer ... and we're accelerating.

And every time I read commentary on what's going on in the world, people are discussing how to arrange your seatbelt as comfortably as possible given that wearing one is part of life, or saying how the best moments in life are sitting with your family and watching the white lines whooshing by, or arguing about whose fault it is that there's a background roar making it hard to hear each other.

If I were in this situation and I didn't know what was next (liftoff), I wouldn't necessarily get it right, but I hope I'd at least be thinking: "This situation seems kind of crazy, and unusual, and temporary. We're either going to speed up even more, or come to a stop, or something else weird is going to happen."`,

`This is an essay about one of those "once you see it, you will see it everywhere" phenomena.  It is a psychological and interpersonal dynamic roughly as common, and almost as destructive, as motte-and-bailey, and at least in my own personal experience it's been quite valuable to have it reified, so that I can quickly recognize the commonality between what I had previously thought of as completely unrelated situations.

The original quote referenced in the title is "There are three kinds of lies: lies, damned lies, and statistics."

Background 1: Gyroscopes
Gyroscopes are weird.

Except they're not.  They're quite normal and mundane and straightforward.  The weirdness of gyroscopes is a map-territory confusion—gyroscopes seem weird because my map is poorly made, and predicts that they will do something other than their normal, mundane, straightforward thing.

In large part, this is because I don't have the consequences of physical law engraved deeply enough into my soul that they make intuitive sense.

I can imagine a world that looks exactly like the world around me, in every way, except that in this imagined world, gyroscopes don't have any of their strange black-magic properties.  It feels coherent to me.  It feels like a world that could possibly exist.

"Everything's the same, except gyroscopes do nothing special."  Sure, why not.

But in fact, this world is deeply, deeply incoherent.  It is Not Possible with capital letters. And a physicist with sufficiently sharp intuitions would know this—would be able to see the implications of a world where gyroscopes "don't do anything weird," and tell me all of the ways in which reality falls apart.

The seeming coherence of the imaginary world where gyroscopes don't balance and don't precess and don't resist certain kinds of motion is a product of my own ignorance, and of the looseness with which I am tracking how different facts fit together, and what the consequences of those facts are.  It's like a toddler thinking that they can eat their slice of cake, and still have that very same slice of cake available to eat again the next morning.

Background 2: H2O and XYZ
In the book Labyrinths of Reason, author William Poundstone delves into various thought experiments (like Searle's Chinese Room) to see whether they're actually coherent or not.

In one such exploration, he discusses the idea of a Twin Earth, on the opposite side of the sun, exactly like Earth in every way except that it doesn't have water.  Instead, it has a chemical, labeled XYZ, which behaves like water and occupies water's place in biology and chemistry, but is unambiguously distinct.

Once again, this is the sort of thing humans are capable of imagining.  I can nod along and say "sure, a liquid that behaves just like water, but isn't."

But a chemist, intimately familiar with the structure and behavior of molecules and with the properties of the elements and their isotopes, would be throwing up red flags.

"Just like water," they might say, and I would nod.

"Liquid, and transparent, with a density of 997 kilograms per meter cubed."

"Sure," I would reply.

"Which freezes and melts at exactly 0º Celsius, and which boils and condenses at exactly 100º Celsius."

"Yyyyeahhhh," I would say, uneasiness settling in.

"Which makes up roughly 70% of the mass of the bodies of the humans of Twin Earth, and which is a solvent for hydrophilic substances, but not hydrophobic ones, and which can hold ions and polar substances in solution."

"Um."

The more we drill down into what we mean by behaves exactly like water, the more it starts to become clear that there just isn't a possible substance which behaves exactly like water, but isn't.  There are only so many configurations of electrons and protons and neutrons (especially while remaining small enough to mimic water's molarity, and to play water's role in various chemical interactions).

Once again, our ability to imagine "a substance that behaves exactly like water, but isn't" is a product of our own confusion.  Of the fuzziness of our concepts, the fast-and-loose-ness of our reasoning, our willingness to overlook a host of details which are actually crucially relevant to the question at hand.

(Tickling at the back of my mind is the axiom "your strength as a rationalist is your ability to be more confused by fiction than by reality."  The thing I'm gesturing toward seems to be a corollary of sorts.)

Of key importance:

Until we actually zero in on the incoherence, the imagined thing feels coherent.  It seems every bit as potentially-real as actually-potentially-real options.

We have no internal feeling that warns us that it's a fabrication masquerading as a possibility.  Our brains do not tell us when they're playing fast and loose.

Fabricated Options
Claim: When people disagree with one another, or are struggling with difficult decisions, they frequently include, among their perceived options, at least one option which is fake-in-the-way-that-XYZ-is-fake.  An option that isn't actually an option at all, but which is a product of incoherent thinking.

This is what this essay seeks to point out, and to give you taste and triggers for.  I would like to establish fabricated options as a category in your mind, so that you are more likely to notice them, and less likely to be taken in by them.

Example 1: Price gouging
This example is one that many of my readers will already be familiar with; it's the kind of topic that gets covered in Econ 101.  I'm not trying to teach it to you from scratch so much as get you to see it as an instance of the class of fabricated options, so that you can port your intuitions about price gouging over to other situations.

In short: during natural disasters or other market disruptions, it often becomes difficult to deliver things like food, water, clothing, toilet paper, medical supplies, gasoline, transportation, etc., to the people who need them.

Sometimes there simply isn't enough supply, and sometimes there's plenty of supply but the logistics become complicated (because, for instance, the act of physically delivering things becomes significantly more dangerous).

In those situations, the price of the needed items often goes through the roof.  Toilet paper selling for $100 a roll, Ubers costing $500 for a ten-mile drive, things like that.

People watching from the outside see this, and feel horror and sympathy and dismay, and often propose (and sometimes successfully enact) legal barriers to price gouging.  They make it illegal to raise the price on goods and services, or put a ceiling on how much it can be raised.

Most such interventions do not produce the desired effect.

The desired effect is that people will just continue to deliver and sell items for a reasonable price, as if nothing has happened.

But that option was never really on the table.  In the middle of a wildfire, or a massive flood, or raging citywide riots, or global supply chain disruption, it simply isn't possible. The actual price of the goods and services, in the sense of "what does it take to provide them?" has gone up, and the market price will necessarily follow.

If you successfully prevent people from selling toilet paper at $100 a roll (rather than simply driving the transactions underground into a black market), the actual effect is usually that there's no one selling toilet paper at all.

The critical insight for this essay is that the thinking of the lawmakers is confused.  It is insufficiently detailed; insufficiently in touch with the reality of the situation.

The lawmakers seem to think that the options are:

[Do nothing], and bad people will continue doing a bad thing, and ludicrously jacking up the price on critically necessary items.
[Pass laws forbidding/punishing sharp price increases in times of trouble], and the bad people will just not do the bad thing, and the critically necessary items will be available for reasonable prices.
... and in that world, given that menu of options, of course we should choose the second one!

But in reality, that is not the menu.  The second option is fabricated.  The story in which [passing that law] results in goods being available at normalish prices is an incoherent fairy tale.  It falls apart as soon as you start digging into the details, and realize that there are forces at work which cannot be dispersed by the stroke of a lawmaker's pen, just as there are physical laws which prevent non-weird gyroscopes and non-water XYZ.

(No matter how easy it is to imagine these things, when we gloss over the relevant details.)

In fact, the true options in most such situations are:

[Do nothing], and people will be able to get access to the critically necessary items, but it will be much harder and more expensive because there is low supply and high logistical difficulty.
[Pass laws forbidding/punishing sharp price increases in times of trouble], and people won't be able to get anything at all, because someone erected an artificial barrier to trade.
And given that menu of options, the first is obviously (usually) better.

Caveat 1: this could be misinterpreted (both in the specific case of price gouging and in the more general case of fabricated options) as encouraging a sort of throw-up-your-hands, if-we-can't-solve-everything-we-shouldn't-bother-to-try-anything helplessness.

That's not the point.  There are often ways to break the tradeoff dynamics at play, in any given situation.  There are often third paths, and ways to cheat, and ways to optimize within the broken system to minimize negative effects and maximize positive outcomes.

There are, in other words, some versions of anti-price-gouging laws that do marginal good and avoid the outright stupid failure modes.

But in order to have those intelligent effects, you first have to see and account for the relevant constraints and tradeoffs, and what I am attempting to point at with the above example is the common human tendency to not do so.  To simply live in the fantasy world of what we could "just" accomplish, if people would "just" do [simple-sounding but not-actually-possible thing].  

Most anti-price-gouging proposals are naive in exactly the way described above; this is not meant to imply that non-naive proposals don't exist.  They do.  I'm just focusing on the central tendency and ignoring the unusually competent minority.
 

Caveat 2: in this example and many others, the fabricated option is less a made-up action and more a made-up story about the consequences of that action.  In both versions of the above dilemma, the listed actions were the same.  The difference was the valence assigned to the "pass laws" option, and the story emerging from it.

This is not always the case.  Sometimes people think the options are A or B, and they are in fact B or C, and sometimes people think the options are A or B and they are, but their imagination distorts the impact of option A into something utterly unrealistic.

For the sake of thinking about the category "fabricated options," this distinction is not especially relevant, and will mostly be ignored in the rest of the essay.  The important thing to note is that in either case, the fabricated option has inflated relative appeal.
 


 

Either it's a genuinely available action A wrapped up in an incoherent and unrealistic story that makes it sound better than the unappealing B, or it's an entirely made-up option A which makes the actual best option B look bad in comparison (causing us to fail to shoot for B over an even worse default C).

In both cases, the result in practice is that option B, which is usually sort of dour and uninspiring and contains unpleasant costs or tradeoffs, gets something like disproportionately downvoted.  Downvoted relative to an impossible standard—treated as worse than it ought to be treated, given constraints.

It's a common assumption among both rationalists and the population at large that people tend to flinch away from things which are unpleasant to think about.  However, people rarely take the time to spell out just what "flinching" means, in practice, or just what triggers it.

The fabrication of options is, I claim, one example of flinching.  It's one of the things we do, as humans, when we feel ourselves about to be forced into choosing an uncomfortable path.  There's a sense of "surely not" that sends our minds in any other available direction, and if we're not careful—if we do not actively hold ourselves to a certain kind of stodgy actuarial insistence-on-clarity-and-coherence—we'll more than likely latch onto a nearby pleasant fiction without ever noticing that it doesn't stand up to scrutiny.

"If only they would just [calm down/listen/take a deep breath/forgive me/let it go/have a little perspective/not be so jealous/not be so irrational/think things through more carefully/realize how much I love them/hang on just a little bit longer], everything would be fine."

Pleasant fictions always outnumber pleasant truths, after all.

Example 2: An orphan, or an abortion?
This is the question posed by John Irving's excellent novel The Cider-House Rules.  The point of the question, within the novel, is to break the false dichotomy wherein the choices are framed as "a living baby or a dead/murdered one?"

A living baby:  🙂

A dead one: 🙁, or perhaps 😡

But "living baby" in the sense often pushed for by pro-life advocates is something of a motte-and-bailey.  It's a naive, fabricated option.  It hand-waves away all of the inconvenient and uncomfortable detail, in exactly the same fashion as "gyroscopes, but not weird."

John Irving's novel doesn't take a stand on which is better—rather, it tries to force the reader to consider the decision at all, instead of getting confused by alluring falsehoods. The footing of the two sides, in the novel, is less uneven-by-design, which seems to me like a step in the right direction.

Example 3: Drowning
I have a longtime friend who I'll refer to here as Taylor, who's got a longtime romantic partner who I'll refer to here as Kelly.

Kelly struggles with various mental health issues.  They genuinely do their best, but as is so often the case, their best is not really "enough."  They spend the better part of each year depressed and mildly delusional, with frequent dangerous swerves into suicidality.

As a side effect of these issues, Kelly—who is at their core an excellent partner for Taylor—also puts Taylor through the wringer.  Kelly has destroyed multiple of Taylor's possessions, multiple times.  Kelly has screamed and yelled at Taylor, multiple times. Over and over, Taylor has asked Kelly what would help, what they can do, how they could change their own behavior to be a better partner for Kelly—and over and over, granting Kelly's explicit requests has resulted in Taylor being yelled at, punished, told to go away.

This has been rough.

Taylor is already the sort of person who doesn't give up on people—the sort of person who would willingly sacrifice themselves for a friend or a family member, the sort of person who will go to genuinely extreme lengths to save a fellow human in trouble.

And on top of that, Taylor genuinely loves Kelly, and has plenty of evidence that—when things are okay—Kelly genuinely loves Taylor.

But for years now, the situation has been spiraling, and Taylor has been getting more and more exhausted and demoralized, and it has become increasingly clear that neither Taylor's direct efforts, nor any of the other resources they've funneled Kelly's way (therapists, medication, financial stability, freedom of movement), are going to be sufficient.  It no longer seems reasonable to expect things to get better.

Taylor and I have talked about the situation a lot, and one of the metaphors that has come up more and more often is that of a drowning person out in rough waters.

From Taylor's point of view, saving Kelly is worth it.  Saving Kelly is worth it even if it means Taylor goes under.  From Taylor's point of view, the options have always been "help save Kelly, or watch Kelly drown."

But this frame is broken.  At this point, it's clear that "help save Kelly" is not a real option.  It's a fabrication, conjured up because it is deeply uncomfortable to face the real choice, which is "let Kelly drown, or drown with them."

(Alternatively, and a little less harshly: "let Kelly figure out how to swim on their own, or keep trying to help them and drown, yourself, without actually having helped them float.")

Example 4: Block lists
I've previously had disagreements with a few people in various bubbles over block lists, and coordination, and what the defaults should be, and where various obligations lie.

In my (probably straw) characterization of the other side, they're fabricating options. They hold a position that (probably deserves steelmanning, but given my current state of understanding) looks like:

Option A, everyone keeps the lines of communication open, and people don't block each other except under extraordinary circumstances (which will tend to be legible and obvious and which basically everyone will agree upon), and that way everyone can see all of the important discussion and there aren't confusing non-overlapping bubbles of fragmented common knowledge.
Option B, some people defect on the project of maintaining a clear and open commons, and block people, and make everything worse for everybody.
Option A is 🙂

Option B is clearly 🙁

In my trying-to-look-at-the-actual-tradeoffs perspective, though—

(Which is not meant to imply that the other people aren't also trying, it just seems to me like if they are trying, they're not quite managing to do so.)

—it seems to me that the actual options are:

Option B, which is very much just as 🙁 as they think it is, in which the world is imperfect and communication and coordination are tricky and costly and often go sideways, and some people need to block other people for all sorts of valid and self-protective reasons, and yep, this makes it harder to coordinate and establish common knowledge but it's the actual best we can do—
or Option A, which is 😱, in which the self-protective blocking option is outlawed or disincentivized-on-the-margin, and people are either punished when they do it anyway (analogous to people being fined for selling toilet paper at inflated prices) or somehow compelled not to, in which they are either constantly exposed to triggers and to attacks from their enemies and abusers and all sorts of other things that are horrible for their mental health, or they just go dark and disappear from the conversation altogether.
The version of option A where [everyone just manages to be in the same room all the time and it's just never disastrously problematic] is obviously better than either of the two options described above.

But it's a substance identical to water that isn't water.  It's not actually on the table.

Example 5: Parental disapproval
Your kid wants to hang out with another kid who you're pretty sure is a bad influence.

Your kid wants to quit their piano lessons, sinking their previous three years of effort.

Your kid seems like they're about to start having sex, or using drugs, or playing Magic: the Gathering.

Your kid doesn't want to go to the family reunion.

Your kid doesn't want to eat that.

I see parents' hopes and expectations come up against the reality of their kids' preferences all the time, and I always have this sucking-in-a-breath, edge-of-my-seat anticipation, because it so often seems to me like parents fabricate options rather than dealing with the tradeoffs with eyes open.

If I just tell them they can't hang out with that kid anymore, the problem will be solved.

If I just make them keep playing piano, they'll thank me later.

I can just tell them no.

I can just tell them they have to.

I can ground them until they comply.

As with the example of price gouging, it's not that there aren't good ways to intervene on the above situations.  The claim is not "the options, as they are at this exact moment, are the only options that will ever be on the table."

Rather, it's "there are a certain limited number of options on the table at this exact moment.  If none of them are satisfactory, someone will have to actively create or uncover new ones.  They can't be willed into being by sheer stubborn fiat."

Option A, in each of the above scenarios, comes with massive costs, usually taken out of the value of the parent-child relationship.

Sure, you can ban your child from a given friendship, but what's going to actually happen is that your child will stop viewing you as their ally and start treating you as a prison warden or appointed overseer—as obstacle to be dealt with.  They'll either succeed at getting around your edict, and you'll have sacrificed a significant part of your mutual trust for nothing, or they'll fail, and resent you for it.

Some parents would argue that this is fine, it's worth it, better the kid be mad at me than suffer [bad outcome].

And in some cases that's genuinely true.

But most of the time, the thing the parent implicitly imagines—that they can get [good outcome] and it won't cost anything in terms of relationship capital—it's not really on the table.

It's not "I'll make them play piano and everything will be fine" versus "they'll lose their piano-playing potential."

It's "I'll make them play piano by using our mutual affection as kindling" or "I'll let them do what they want and preserve our relationship."

Neither option is great, viewed through that lens.  It's an orphan on the one hand and an abortion on the other.

But that's the thing.  Most of the time, neither option is great.  In difficult situations, it's wise to be at least a little suspicious of straightforward, easy Options A that are just so clearly better than those uncomfortably costly tradeoff-y Options B.

Example 6: 2020
(This section left as an exercise for the reader.)

Conclusion
A likely thought on the minds of some readers is that this isn't exactly new ground, and we already have all of the pieces necessary to individually identify each instance of fabricated options based on their inherent falsehood, and therefore don't actually need the new category.

I disagree; I find that fine distinctions are generally useful and have personally benefitted from being able to port strategies between widely-spaced instances of option fabrication, and from being able to train my option-fabrication-recognizer on a broad data set.

That being said: beware the failure mode of new jargon, which is thinking that you now recognize [the thing], rather than that you are now equipped to hypothesize [maybe the thing?].  The world would be a better place if people's response to the reification of concepts like "sealioning" or "DARVO" or "attention-deficit disorder" were to ask whether that's what's happening here, and how we would know as opposed to immediately weaponizing them.

(Alas, that's a fabricated option, and the real choice is between "invent good terms but see them misused a bunch" and "refuse to invent good terms."  But maybe LessWrong can do better than genpop.)

As for what to do about fabricated options (both those your own brain generates and those generated by others), the general recommendation is pretty much "use your rationality" and there isn't room in this one essay to operationalize that.  My apologies.

If you're looking for e.g. specific named CFAR techniques that might come in handy here, I'd point you toward TAPs (especially TAPs for noticing fabricated options as they come up, or booting up your alert awareness in situations where they're likely to) and Murphyjitsu (which is likely to improve people's baseline ability to both recognize glossed-over fairy tales and patch the holes therein).  You might also work on building your general noticing skill, perhaps starting with any number of writings by Logan Strohl, and on double crux and similar tools, which will make it easier to make disagreements over the menu-of-options productive rather than not.

In the meantime, I would deeply appreciate it if any comments sharing examples of the class contained the string #EXAMPLE, and if any comments containing concrete recommendations or stories about how-you-responded contained the string #TOOLS. This will make it easier for the comment section to stand as an enduring and useful appendix to this introduction.

Good luck.`]

const getElements = async (essay: string) => {
  const completion = await openai.chat.completions.create({
    messages: [{role: "user", content: llm_prompt(essay)}],
    model: "gpt-4",
  });

  try {
    return JSON.parse(completion.choices[0].message.content || '')
  } catch (error) {
    console.error('Error parsing response:', error);
    throw error;
  }
}

const prompter = (el: string) => `https://s.mj.run/Bkrf46MPWyo  Aquarelle book cover inspired by topographic river maps and mathematical diagrams and equations. ${el}. Fade to white --no text --ar 8:5 --iw 2.0 --s 250 --chaos 30 --v 6.0`


async function go(el: string) {
  let promptResponseData : any;
  // generate the image
  try {
    const response = await fetch('https://cl.imagineapi.dev/items/images/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${imagine_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({prompt: prompter(el)})
    });

  promptResponseData = await response.json();
  console.log(promptResponseData);
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }

  // check if the image has finished generating
  // let's repeat this code every 5000 milliseconds (5 seconds, set at the bottom)
  const intervalId = setInterval(async function () {
    try {
      console.log('Checking image details');
      const response = await fetch(`https://cl.imagineapi.dev/items/images/${promptResponseData.data.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${imagine_key}`, // <<<< TODO: remember to change this
          'Content-Type': 'application/json'
        }
      })

      const responseData = await response.json()
      console.log(responseData)
      if (responseData.data.status === 'completed' || responseData.data.status === 'failed') {
        // stop repeating
        clearInterval(intervalId);
        console.log('Completed image detials', responseData.data);
      } else {
        console.log("Image is not finished generation. Status: ", responseData.data.status)
      }
    } catch (error) {
      console.error('Error getting updates', error);
      throw error;
    }
  }, 5000 /* every 5 seconds */);
  // TODO: add a check to ensure this does not run indefinitely
}

async function main () {
  let i = 0
  while (i < essays.length) {
    const elements = await getElements(essays[i])
    let j = 0
    while (j < elements.length) {
      await go(elements[j])
      j++
    }
    i++
  }
}

main()