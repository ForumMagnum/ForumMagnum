*This post, and much of the following sequence, was greatly aided by feedback from the following people (among others):* [*Lawrence Chan*](https://www.lesswrong.com/users/lawrencec)*,* [*Joanna Morningstar*](https://www.lesswrong.com/users/joanna-morningstar)*,* [*John Wentworth*](https://www.lesswrong.com/users/johnswentworth)*,* [*Samira Nedungadi*](https://www.lesswrong.com/users/mayleaf)*,* [*Aysja Johnson*](https://www.lesswrong.com/users/aysja)*,* [*Cody Wild*](https://www.lesswrong.com/users/decodyng)*,* [*Jeremy Gillen*](https://www.lesswrong.com/users/jeremy-gillen)*,* [*Ryan Kidd*](https://www.lesswrong.com/users/ryankidd44)*,* [*Justis Mills*](https://www.lesswrong.com/users/justismills) *and* [*Jonathan Mustin*](https://www.lesswrong.com/users/flowerfeatherfocus)*.*

Introduction & motivation
-------------------------

In the course of researching optimization, I decided that I had to really understand what entropy is.[^a26yynbcolo] But there are a lot of other reasons why the concept is worth studying:

*   Information theory:
    *   Entropy tells you about the amount of information in something.
    *   It tells us how to design optimal communication protocols.
    *   It helps us understand strategies for (and limits on) file compression.
*   Statistical mechanics:
    *   Entropy tells us how macroscopic physical systems act in practice.
    *   It gives us the heat equation.
    *   We can use it to improve engine efficiency.
    *   It tells us how hot things glow, which led to the discovery of quantum mechanics.
*   Epistemics (an important application to me and many others on LessWrong):
    *   The concept of entropy yields the [maximum entropy principle](https://en.wikipedia.org/wiki/Principle_of_maximum_entropy), which is extremely helpful for doing general Bayesian reasoning.
*   Entropy tells us how "unlikely" something is and how much we would have to fight against nature to get that outcome (i.e. optimize).
*   It can be used to explain the [arrow of time](https://en.wikipedia.org/wiki/Entropy_as_an_arrow_of_time).
*   It is relevant to the [fate of the universe.](https://en.wikipedia.org/wiki/Heat_death_of_the_universe)
*   And it's also a fun puzzle to figure out!

I didn't intend to write a post about entropy when I started trying to understand it. But I found the existing resources (textbooks, Wikipedia, science explainers) so poor that it actually seems important to have a better one as a prerequisite for understanding optimization! One failure mode I was running into was that other resources tended only to be concerned about the application of the concept in their particular sub-domain. Here, I try to take on the task of synthesizing the *abstract* concept of entropy, to show what's so deep and fundamental about it. In future posts, I'll talk about things like:

*   How abstract entropy can be made meaningful on [continuous spaces](https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy)
*   Exactly where the "second law of thermodynamics"[^6gxudhss0db] comes from, and exactly when it holds (which turns out to be much broader than thermodynamics)
*   How several domain-specific types of entropy relate to this abstract version

Many people reading this will have some previous facts about entropy stored in their minds, and this can sometimes be disorienting when it's not yet clear how those facts are consistent with what I'm describing. You're welcome to skip ahead to the relevant parts and see if they're re-orienting; otherwise, if you can get through the whole explanation, I hope that it will eventually be addressed!

But also, please keep in mind that I'm not an expert in any of the relevant sub-fields. I've gotten feedback on this post from people who know more math & physics than I do, but at the end of the day, I'm just a rationalist trying to understand the world.

Abstract definition
-------------------

Entropy is so fundamental because it applies far beyond our own specific universe, the one where something close to the standard model of physics and general relativity are true. It applies in any system with different states. If the system has dynamical laws, that is, rules for moving between the different states, then some version of the second law of thermodynamics is also relevant. But for now we're sticking with statics; the concept of entropy can be coherently defined for sets of states even in the absence of any "laws of physics" that cause the system to evolve between states. The example I keep in my head for this is a Rubik's Cube, which I'll elaborate on in a bit.

**The entropy of a state is the number of bits you need to use to uniquely distinguish it.**

Some useful things to note right away:

*   Entropy is a concrete, positive number of bits,[^pi8b39u5hd7] like 4, 73.89, or \\(10^{61}\\).
*   Its definition does not rely on concepts like heat or energy, or a universe with spatial dimensions, or even anything to do with random variables.
*   You're distinguishing the state from all the other states in a given set. Nothing about the structure or contents of this set matters for the definition to be applicable; just the number of things in the set matters.
*   Entropy depends on an agreed-upon strategy for describing things, and is "subjective" in this sense.

But after you *agree* on a strategy for uniquely distinguishing states, the entropy of said states becomes fixed relative to that strategy (and there are often clearly most-sensible strategies) and thus, in that sense, objective. And further, there are limits on how low entropy can go while still describing things in a way that actually distinguishes them; the subjectivity only goes so far.

Macrostates
-----------

I just defined entropy as a property of specific states, but in many contexts you don't care at all about specific states. There are a lot of reasons not to. Perhaps:

*   They're intractable to ever learn, like the velocity of every particle in a box.
*   You're not even holding a specific state, but are instead designing something to deal with a "type" of state, like writing a compression algorithm for astronomical images.
*   There are [uncountably many states](https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy).
*   Every state is just as good to you; you don't care to assign *any* states lower entropy than others.

In cases like these, we only care about **how many possible states** there are to distinguish among.

Historically, the individual states are called **microstates**, and collections of microstates are called **macrostates**. Usually the macrostates are connotively characterized by a generalized property of the state, like "the average speed of the particles" (temperature). In theory, a macrostate could be any subset, but usually we will care about a particular subset for some reason, and that reason will be some macroscopically observable property.

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/e37b3ba5473408e2cb09748683981a605b81d5d4fc32ba1a.png)

If our system consists of the result of tossing two dice, then this grid represents all the possible outcomes. We could partition this into macrostates based on the sum of the two dice, as shown here with dashed lines.

Two basic strategies for distinguishing states
----------------------------------------------

I would say that *any* method used to distinguish states forms a valid sub-type of entropy. But there are a couple really fundamental ones that are worth describing in detail. The first one I'll talk about is using **finite binary strings** to label each individual state. The second one is using **yes/no questions** to partition sets until you've identified your state. (Note that both these methods are defined in terms of sets of *discrete* states, so [later I'll talk](https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy) about what happens in continuous spaces. A lot of real-world states have real-valued parameters, and that requires special treatment.)

### Binary string labels

In order to be able to say which of the possible states a system is in, there has to be some pre-existing way of referring to each individual state. That is, the states must have some kind of "labels". In order to have a label, you'll need some set of symbols, which you put in sequence. And it turns out that anything of interest to us here that could be done with a finite alphabet of symbols can also be done with an alphabet of only two symbols,[^mh08kmzx85q] so we will spend the whole rest of this sequence speaking in terms of binary.[^jlulplwrhrb]

It would be [parsimonious](https://en.wikipedia.org/wiki/Occam%27s_razor) to use the shortest descriptions first. Fewer symbols to process means faster processing, less space required to store the labels, et cetera. So we'll label our states starting from the shortest binary strings and working our way up.

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/ddd04a6c3ac55e64bc3e020d7382fd0faf2bbb089eb96b63.png)

You could think of the binary string labels like barcodes. Their purpose is to uniquely distinguish a bunch of arbitrary objects. They may encode information about the object, or they might just be registered in a big look-up table. If you have too many objects, then you'll need to start using longer bar codes.

Here's where we can see one way in which entropy is subjective. For any given set of states, there are many ways to give labels to the individual elements – you can always just swap the labels around. In contexts where quantities of entropy are treated as objective, that's because the context includes (explicitly or implicitly) chosen rules about how we're allowed to describe the states. On top of that, while you can swap labels, there are limits to how few bits we can use overall. You could always choose a state-labeling scheme that uses more bits, but there is a minimum average number of bits we can use to describe a certain number of states (i.e. the number we get by using the shortest strings first). Often, when talking about entropy, it's an implicit assumption that we're using a maximally efficient labeling.

Let's get a tiny bit more concrete by actually looking at the first several binary strings. The first string is the ["empty" string](https://en.wikipedia.org/wiki/Empty_string), with no characters, which therefore has length 0. Next, there are only two strings which have a length of 1: the string 0 and the string 1. This means that, no matter what my system is, and no matter how many states it has, at most two states could be said to have an entropy of 1. There are twice as many strings with length 2: 00, 01, 10, and 11. Thus, there are (at most) four states that could be said to have entropy 2. For every +1 increase in entropy, there are *twice* as many states that could be assigned that entropy, because there are twice as many binary strings with that length.[^0qfkbz6qhwj]

I think it's easy for people to get the impression that the rarity of low-entropy states comes from something more complex or metaphysical, or is tied to the nature of our universe. But it turns out to be from this simple math thing. **Low-entropy states are rare because short binary strings are rare.**

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/9d3433b65bab5f3445122eadd62dc5a45a5c1d3a28bab127.png)

The first 31 binary strings in lexical order. The first one is just a line, denoting the empty string. Shorter strings are exponentially more rare!

To be more concrete, consider the Rubik's Cube. As you turn the faces of a Rubik's Cube, you change the position and orientation of the little sub-cubes. In this way, the whole cube could be considered to have different states. There's no law that dictates how the cube moves from one state to the next; you can turn the faces however you want, or not at all. So it's not a system with a time-evolution rule. Nonetheless, we can use the concept of entropy by assigning labels to the states.

Intuitively, one might say that the "solved" state of a Rubik's Cube is the most special one (to humans). Turning one side once yields a state that is slightly less special, but still pretty special. If you turn the sides randomly [twenty times](http://www.cube20.org/qtm/), then you almost certainly end up in a state that is random-looking, which is to say, not special at all. There are about \\(4.3 \cdot 10^{19}\\) possible Rubik's Cube states, and the log of that number is about 65.2[^ikdk2gb237]. Thus, a random Rubik's Cube state takes about 65 bits to specify.[^ddpqvgrp58p]

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/9bbd525cf1ad461294a1fe7a49d7f56fda839e90cb9d505f.png)

We could assign the empty string to the solved state, giving it zero entropy.

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/96fd65eaa70f3b858458f1a55b767a0491a763e338620d1e.png)

There are twelve one-move states, which could be assigned the strings from 0 to 101.

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/8a4f92b6405ed832a45a55cd1aed629b93289f455927b5ad.png)

A random state like this would have a random binary string attached to it, like maybe 01100001100011011010010101100100111001001100011000110101001001001.

According to our above string-labeling, the solved state would have zero entropy. Similarly intuitively, almost-solved states would have almost-zero entropy. So if you turned one side a quarter turn, then maybe that state gets labeled with one bit of entropy. Perhaps we could carry on with this scheme, and label the states according to how many moves you need to restore the cube from that state to the solved state.[^io9k70v4ks] There's nothing normative here; this just seems like a useful thing to do if you care about discussing how to solve a Rubik's Cube. You could always randomly assign binary strings to states. But we rarely want that; humans care a lot about patterns and regularities. And this is how entropy comes to be associated with the concept of "order". **The only reason order is associated with low entropy is because ordered states are rare.** The set of ordered states is just one particular set of states that is much smaller than the whole set. And because it's a smaller set, we can assign the (intrinsically rare) smallest strings to the states in that set, and thus they get assigned lower entropy.

You might object that ordered states are a *very* special set! I would agree, but the way in which they are special has nothing to do with this abstract entropy (nor with the second law). The way in which they are special is simply the reason why we care about them in the first place. These reasons, and the exact nature of what "order" even is, constitute a whole separate subtle field of math. I'll talk about this in a future post; I think that "order" is synonymous with Kolmogorov complexity. It's somewhat unfortunate how often entropy and order are conflated, because the concept of order can be really confusing, and that confusion bleeds into confusion about entropy. But it's also worth noting that any reasonable definition of order (for example, particles in a smaller box being more ordered than particles in a bigger box, or particles in a crystal being more ordered than particles in a gas) would be a consistent definition of entropy. You'd just be deciding to assign the shorter labels to those states, and states that are "ordered" in some other way (e.g. corresponding to the digits of \\(\pi\\)) wouldn't get shorter labels. But this is fine as long as you remain consistent with that labeling.

The binary string labeling scheme constitutes a form of absolute lower bound on average (or total) entropy. We can calculate that bound by summing the lengths of the first \\(W\\) binary strings and dividing by \\(W\\).[^8dysop0rn9w] Let \\(S_W\\) be the entropy of a set of \\(W\\) states, and let \\(l(i)\\) be the length of the \\(i\\)th binary string. Then the average is by definition

\\\[\langle S_W \rangle = \frac{\sum_{i=0}^W l(i)}{W}.\\\]

By looking at the above image of the first 31 binary strings, we can see that for \\(W = 2^n - 1\\),

\\\[\sum_{i=0}^W l(i) = \sum_{l=0}^{n - 1} 2^l \cdot l,\\\]

which is to say that you can sum all the lengths \\(l(i)\\) by breaking it up into terms of each length \\(l\\) times the number of strings of that length (\\(2^l\\)). Next, it can be shown by induction that that sum has a closed form;

\\\[\sum_{l=0}^{n - 1} 2^l \cdot l = 2^n(n - 1) - 2^n + 2.\\\]

Substituting back in \\(n = \log(W + 1)\\), dividing by \\(W\\), and doing algebraic manipulation, we get that

\\\[\langle S_W \rangle \leq \log(W+1) - 2 + \frac{\log(W+1)}{W}.\\\]

This is a very tight inequality. It's exact when \\(W = 2^n - 1\\), and \\(\langle S_W \rangle\\) is monotonic, and \\(\log\\) grows very slowly.

The three terms are ordered by their [big-O](https://en.wikipedia.org/wiki/Big_O_notation) behavior. In the limit of large numbers of states, we really don't care about the smaller terms, and we use \\(\langle S_W \rangle = O(\log W)\\). Thus, the average entropy grows as the length of the longest strings in the set.

### Yes/no questions

There's another very natural way we could use bits to distinguish one state from a set of states (especially when all the states are the same to us). This method is identical to the kids' game [Guess Who?](https://en.wikipedia.org/wiki/Guess_Who%3F). In this game, you and your opponent each pick a person card from a fixed set of possible person cards. Then you try to guess which card your opponent has picked by asking yes-or-no questions about the person, like, "Do they have blonde hair?". You each have a board in front of you with copies of all the cards, so you can flip down the ones you've eliminated (which is highly satisfying). The way to minimize the expected number of questions you'll need to guess the person[^krma9vb21f] is to ask questions that eliminate half[^y50eygbc9ig] the remaining possible cards. If you start with \\(W = 2^n\\) cards, then this will require \\(n\\) questions, and therefore you'll use \\(n\\) bits of information to pinpoint a state, making your entropy equal to \\(n = \log(W)\\). This is your entropy for *every* specific card; you never assign a card zero entropy.

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/animations/df234e761adcf4ea69e7eb2085a112e1e232ae5bba617610.gif)

An illustration of one player's view of Guess Who?.

This way of measuring entropy is usually more useful for macrostates, because typically we have a huge number of microstates in a macrostate, and we don't care about any of the individual ones, just how many there are. So to assign entropy to a microstate in this case, we just look at which macrostate it's in (e.g. check its temperature), calculate the number of possible microstates that are consistent with that macrostate, and take the log.

If a Rubik's Cube is in the macrostate of being one move away from solved, then (since there are 12 such (micro)states) according to the yes/no questions method of assigning entropy, that macrostate has an entropy of \\(\log(12) = 3.58\\) bits. The number of microstates in the macrostate "one face is solved" is much, much higher, and so that macrostate has a much higher entropy. As we'll talk about in a later post, increased temperature means an increased number of possible microstates, so a higher-temperature object has higher entropy.

### How they compare

You may notice that while the binary string model gives us \\(O(\log W)\\) entropy, the yes/no question model gives us *exactly* \\(\log(W)\\)[^9i6jb0p1fl]. This reveals an underlying subtlety about our models. The label-assignment form of entropy is somewhat *less* than the binary questions form of entropy. Both are formalizations of the number of bits you need to describe something. But the question-answering thing seems like a pretty solidly optimal strategy; how could you possibly do it in fewer bits?

Imagine that the questions are fixed. For every state (e.g. Guess Who? card), the answers to the series of questions are just a list of yeses and nos, which is the same as a binary string. So each state could be said to be labeled with a binary string which is \\(\log(W)\\) bits long. This is now just like our previous binary string strategy, except that setup uses the strings of all lengths *up to* \\(\log(W)\\), and this one uses only strings of *exactly* length \\(\log(W)\\).

The difference is that, if you had the states labeled with the shorter strings, and you were playing the game by asking a series of questions (equivalent to "Is the card's label's first bit 0?"), then you would sometimes reach the end of a binary string before you'd asked all \\(\log(W)\\) questions. If the state happened to be the one labeled with just a 0, and your first question was, "Is the first bit a 0?" then the answer would be "yes" – but also, there would be further information, which is that there were no more bits left in the string. So in this formulation, that's equivalent to there being *three* pieces of information: "yes", "no" and "all done". If you were expecting only two possible answers, this could be considered a type of cheating, smuggling in extra information. It's as if all the finite binary strings need to have a special terminating character at the end.

So, the minimum average number of bits you need to distinguish a state depends on whether you're handed a whole label all at once (and know that's the whole label), or whether you need to query for the label one bit at a time (and figure out for yourself when you've received the whole label).

Exactly what is a bit?
----------------------

In the opening definition of entropy, I used the word "bit", but didn't define it. Now that we've talked about cutting sets of states in half, it's a good time to pause and point out that *that* is what a bit is. It's often very natural and useful to think of bits as thing-like, i.e. of bits as existing, of there being a certain number of bits "in" something, or of them moving around through space. This is true in some cases, especially in computer storage, but it can be confusing because that's not really how it works in general.[^thq2hgp2ob] It's often *not* the case that the bits are somewhere specific, even though it feels like they're "in there", and that can contribute to them (and entropy) feeling elusive and mysterious.

For a state to "have" a bit "in" it just means that there was another way for that state to be (which it is not). If a state has a degree of freedom in it that has two possible values, then you can coherently think of the bit as being "in" that degree of freedom. But note that this relies on counterfactual alternatives; it is not *inherently* inside the specific state.

Concretely, a state could have a simple switch in it (or a particle with up or down spin, or an object which could be in either of two boxes). If half of the entire set of possible states has the switch on, and the other half has the switch off, then I think it's fair to say that the bit is in the switch, or that the switch is one bit of entropy (or information). However, if 99% of states have the switch on and 1% have it off, then it contains significantly less than one bit, and if *all* states have the switch on, then it is zero bits.

As a simple example of a bit not being clearly located, consider a system that is just a bunch of balls in a box, where the set of possible states is just different numbers of balls. One way to divide up the state space is between states with an even number of balls versus states with an odd number of balls. This divides the state space in half, and that constitutes a bit of information that does not reside somewhere specific; it can be "flipped" by removing any single ball.

Thus, you can also see that just because you've defined a bit somewhere, it doesn't mean that feature *must* represent a bit. Though the quantity "the number of times you can cut the state space in half" is an objective property of a state space, the exact *ways* that you cut the space in half are arbitrary. So just because your state contains a switch that could be flipped does not mean that the switch *must* represent a bit.

![](https://39669.cdn.cke-cs.com/rQvD3VnunXZu34m86e5f/images/fca4cb7f8983d26f0fdf07160f1d31f129435d787e034900.png)

If you have a system with four states A, B, C and D, and your first bit is {A, B}/{C, D}, then your second bit could either be {A, C}/{B, D} or {A, D}/{B, C}. Either way, the entropy of the system is exactly two bits.

Probabilities over states
-------------------------

In all of the above discussion of average entropies, we implicitly treated the states as equally likely. This is not always true, and it's also a problematic premise if there are [infinitely many states](https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy). If you want to get the average entropy when some states are more likely than others, then you can just take a standard expected value:

\\\[\mathbb{E}[S_X] = \sum_{x \in X} {p(x) S(x)}.\\\]

Here, \\(S\\) is our entropy, \\(X\\) is the set of possible states \\(x\\), and \\(p(x)\\) is the probability of each state. If \\(p\\) is uniform and the size of \\(X\\) is \\(W\\), then the minimum average entropy is the thing we already calculated above. If \\(p\\) is not uniform, then the best thing we could do is give the most likely states the shortest strings, which could give us an average entropy that is arbitrarily small (depending on how non-uniform \\(p\\) is).

That's what we could do in the binary string labels model. But what about in the yes/no questions model? What if, for example, we know that our friend likes picking the "Susan" card more often? If the cards aren't equally likely, then we shouldn't just be picking questions that cut the remaining *number* of cards in half; instead we should be picking questions that cut the remaining *probability mass* in half. So, if we know our friend picks Susan half the time, then a very reasonable first question would be, "Is your card Susan?".

But now our labels are not the same lengths. This feels like it's bringing us back to the binary string model; if they're not the same length, how do we know when we've asked enough questions? Don't we need an "end of string" character again? But a subtle difference remains. In the binary string model, the string 0 and the string 1 both refer to specific states. But in our game of Guess Who?, the first bit of all the strings refers to the answer to the question, "Is your card Susan?". If the answer is yes, then that state (the Susan card) just gets the string 1. If the answer is no, then the first bit of all the remaining states (i.e. the non-Susan cards) is 0 – but there's a second question for all of them, and therefore a second bit. No card has the string that is just 0.

The generalization here is that, in the yes/no questions model, no binary string label of a state can be a **prefix** of another state's binary string label. If 1 is a state's whole label, then no other label can even start with a 1. (In the version of the game where all states are equally likely, we just use equally-sized strings for all of them, and it is the case that no string can be a prefix of a different string of the same size.)

This is how you can use different-sized labels without having an additional "all done" symbol. If the bits known so far match a whole label, then they are not a prefix of any other label. Therefore they could not match any other label, and so you know the bits must refer to the label they already match so far. And using different-sized labels in your "prefix code" lets you reduce your expected entropy in cases where the states are not equally likely.

There are infinitely many prefix codes that one could make (each of which could have finitely or infinitely many finite binary strings).[^ola1nhif4ee] It turns out that for a given probability distribution \\(p(x)\\) over states, the encoding that minimizes average entropy uses strings that have one bit for every halving that it takes to get to \\(p(x)\\) (e.g. if \\(p(x) = \frac{1}{4}\\), that's two halvings, so use two bits to encode the state \\(x\\)). In other words we can use labels such that

\\\[S(x) = \log\frac{1}{p(x)},\\\]

and therefore,

\\\[\mathbb{E}[S_X] = \sum_{x \in X} {p(x) \log\frac{1}{p(x)}},\\\]

which is minimal. (This is also how we can assign an entropy to a macrostate of unequally-likely microstates; we still want it to represent the number of yes/no questions we'd have to ask to get to a specific microstate, only now it has to be an expected value, and not an exact number.)

This definition, formally equivalent to Shannon entropy and Gibbs entropy, is often considered canonical, so it's worth taking a step back and reminding ourselves how it compares to what else we've talked about. In the beginning, we had a set of equally-likely states, and we gave the ones we "liked" shorter binary string labels so they required fewer bits to refer to. Next, we had sets of equally likely states that we didn't care to distinguish among, and we gave them all equally long labels, and just cared about how many bits were needed to narrow down to one state. Here, we have *un*equally-likely states, and we're assigning them prefix-codes in relation to their probability, so that we can minimize the expected number of bits we need to describe a state from the distribution.

All of these are ways of using bits to uniquely distinguish states, and thus they are all types of entropy.

Negentropy
----------

Negentropy is the "potential" for the state (micro or macro) to be higher entropy – literally the maximum entropy minus the state's entropy:[^mq56rpxbm2c]

\\\[J(x) = S_{max} - S(x).\\\]

Note that while the entropy of a state is something you can determine from (a labeling of) just that state, the negentropy is a function of the maximum *possible* entropy state, and so it's determined by the entire collection of states in the system. If you have two systems, A and B, where the only difference is that B has twice as many states as A, then any state in both systems will have one more bit of *neg*entropy in system B (even though they have the same *entropy* in both systems).

When we have a finite number of states, then \\(S_{max}\\) is just some specific binary string length. But for systems with an [infinite number of states](https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy) (and thus no bound on how long their labels are), \\(S_{max}\\) is infinite, and since \\(S(x)\\) is finite for every state \\(x\\), every specific state just does actually have infinite negentropy.

If we're using entropy as the number of yes/no questions, and all the states are equally likely, then they all have equal entropy, and therefore zero negentropy. If they have different probabilities and we've assigned them labels with a prefix code, then we're back to having a different maximum length to subtract from.

If we're considering the entropy of a macrostate, then what is the maximum "possible" entropy? I'd say that the maximum entropy macrostate is the whole set of states.[^0hgb7ntsh85h] Therefore the negentropy of a macrostate \\(M\\) is how many halvings it takes to get from the whole set of states to \\(M\\).

If the system has an infinite number of microstates, then a macrostate could have finite *or* infinite negentropy; a macrostate made of a *finite* number of microstates would have infinite negentropy, but a macrostate that was, say, one-quarter of the total (infinite) set of states would have a negentropy of 2. As above, if the states are not equally likely, then the generalization of macrostate negentropy is not in terms of *number* of microstates but instead their probability mass. Then, the negentropy of a macrostate \\(M\\) is

\\\[J(M) = \log\frac{1}{p(M)}.\\\]

One concrete example of negentropy would be a partially-scrambled Rubik's Cube. Using the distance-from-solved entropy discussed above, a cube that is merely 10 moves from solved is far from the maximum entropy of 26 moves from solved, and thus has large negentropy.

Another example shows that negentropy could be considered the potential bits of information you could store in the state than you currently are. If your file is 3 KB in size, but can be losslessly compressed to 1 KB, then your file has about 1 KB of entropy and 2 KB of negentropy (because the highest-entropy file you can store in that space is an incompressible 3 KB).

What's next
-----------

At the risk of over-emphasizing, all the above is (if my understanding is correct) the *definition* of entropy, the very source of its meaningfulness. Any other things that use the term "entropy", or are associated with it, do so because they come from the above ideas. In a future post I try to trace out very explicitly how that works for several named types of entropy. In addition, [we will show](https://www.lesswrong.com/posts/yJorhsuEKCbYrycav/dealing-with-infinite-entropy) how these ideas can meaningfully carry over to systems with continuous state spaces, and also consider moving between states over time, which will allow us to work out other implications following directly from the abstract definition.

[^a26yynbcolo]: The quickest gloss is that optimization is a decrease in entropy. So it's a pretty tight connection! But those six words are hiding innumerable subtleties. 

[^6gxudhss0db]: Something like "the entropy of a closed system tends to increase over time"; there are many formulations. 

[^pi8b39u5hd7]: Some contexts will use "nats" or "dits" or whatever. This comes from using logarithms with different bases, and is just a change of units, like meters versus feet. 

[^mh08kmzx85q]: I've justified the use of binary before. There's a lot of interesting detail to go into about what changes when you use three symbols or more, but all of the heavy-lifting conclusions are the same. Turing machines that use three symbols can compute exactly the set of things that Turing machines with two symbols can; the length of a number \(n\) is \(O(\log n)\) whether it's represented in binary or trinary; et cetera. 

[^jlulplwrhrb]: Binary strings are usually written out with 0s and 1s, and I'll do that in the text. But I personally always visualize them as strings of little white and black squares, which is what I'll use in the illustrations. This is probably because I first learned about them in the context of Turing machines with tapes. 

[^0qfkbz6qhwj]: Note that the entropy of a state is the length of its label, and not the label itself; the specific layout of 0s and 1s just serves to distinguish that label from other labels of the same length. 

[^ikdk2gb237]: Justification for merely taking the log comes from the derivation at the end of this section, though you may have been able to intuit it already! 

[^ddpqvgrp58p]: Again, this is assuming you're using a binary string labeling scheme that uses all the smaller strings before using bigger strings. You could always decide to label every state with binary strings of length 100. 

[^io9k70v4ks]: The typical minimal notation for describing Rubik's Cube algorithms has one letter for each of the six faces (F, B, L, R, U, D), and then an apostrophe for denoting counter-clockwise (and a number of other symbols for more compact representations). This means that six of the one-move states have a label of length one, and six others have length two. This all comes out in the big-O wash, and the label lengths will end up differing by a constant factor, because e.g. \(\log_6(x) = \frac{\log_2(x)}{\log_2(6)} = 0.387\cdot \log_2(x)\). 

[^8dysop0rn9w]: I'll have bits of math throughout this sequence. This is a pretty math-heavy concept, but I still don't think that most of the actual equations are essential for gaining a useful understanding of entropy (though it is essential to understand how logarithms work). So if you feel disinclined to follow the derivations, I'd still encourage you to continue reading the prose.None of the derivations in this sequence are here for the purpose of rigorously proving anything, and I've tried to include them when the structure of the equations actually helped me understand the concepts more clearly. 

[^krma9vb21f]: Wikipedia informs me that this is not technically the optimal strategy for winning the game, because if you are behind and your opponent plays optimally, then you're better off guessing specific people and hoping to get lucky. 

[^y50eygbc9ig]: Or as close to half as you can get. 

[^9i6jb0p1fl]: Again, only exact when \(W\) is a power of 2, but in any case, the binary string one is strictly less than the yes/no questions one, which is what we want to resolve here. 

[^thq2hgp2ob]: For this reason I've been careful not to use the phrase "bit string", instead sticking with "binary string". For our purposes, a binary string is a bit string if each of those symbols could have been the flipped value (for some relevant definition of "could"). 

[^ola1nhif4ee]: Examples of finite prefix codes: {0, 1}, {0, 10, 11}, {00, 01, 10, 110, 1110, 1111}Example of an infinite prefix code: {0, 10, 110, 1110, 11110, ... } 

[^mq56rpxbm2c]: Note that for many systems, most states have maximum or near-maximum entropy, such that the negentropy is virtually the same as the average entropy minus the state's entropy; this would also mean that most states have virtually zero negentropy. 

[^0hgb7ntsh85h]: You could argue that the maximum entropy macrostate is just the macrostate that contains only the highest entropy state(s). I think the spirit of macrostates is that you don't consider individual states, and thus it would be "cheating" to pick out specific states to form your macrostate. In the spirit of \(S = \log(W)\), the way to maximize \(S\) is to maximize \(W\), that is, include all states into \(W\).