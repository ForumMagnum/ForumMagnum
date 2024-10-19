Suppose two Bayesian agents are presented with the same spreadsheet - IID samples of data in each row, a feature in each column. Each agent develops a generative model of the data distribution. We'll assume the two converge to the same predictive distribution, but may have different generative models containing different latent variables. We'll also assume that the two agents develop their models independently, i.e. their models and latents don't have anything to do with each other informationally except via the data. Under what conditions can a latent variable in one agent's model be faithfully expressed in terms of the other agent's latents?

Let’s put some math on that question.

The n “features” in the data are random variables \\(X_1, …, X_n\\). By assumption the two agents converge to the same predictive distribution (i.e. distribution of a data point), which we’ll call \\(P[X_1, …, X_n]\\). Agent \\(j\\)’s generative model \\(M_j\\) must account for all the interactions between the features, i.e. the features must be independent given the latent variables \\(\Lambda^j\\) in model \\(M_j\\). So, bundling all the latents together into one, we get the high-level graphical structure:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXf9P7MWyNNDy5qG00JmJtiFw6ljRtRhVO6R5w5Kmt96bkjxuzPCtyhmBFei176XR6eDRjRBNgZYS7HnmOymBHgIdvSQ4CKFABI_DZCiP6Xroylrw-ZvC1hGKS54CnS8K4u8gKB11BwefBgLs_rIuxLCwoIq?key=IQLvP8ifNLtM6SeDgu9cOA)

which says that all features are independent given the latents, under each agent’s model.

Now for the question: under what conditions on agent 1’s latent(s) \\(\Lambda^1\\) can we *guarantee* that \\(\Lambda^1\\) is expressible in terms of \\(\Lambda^2\\), no matter what generative model agent 2 uses (so long as the agents agree on the predictive distribution \\(P[X]\\))? In particular, let’s require that \\(\Lambda^1\\) be a function of \\(\Lambda^2\\). (Note that we’ll weaken this later.) So, when is \\(\Lambda^1\\) *guaranteed* to be a function of \\(\Lambda^2\\), for *any* generative model \\(M_2\\) which agrees on the predictive distribution \\(P[X]\\)? Or, worded in terms of latents: when is \\(\Lambda^1\\) *guaranteed* to be a function of \\(\Lambda^2\\), for *any* latent(s) \\(\Lambda^2\\) which account for all interactions between features in the predictive distribution \\(P[X]\\)?

The Main Argument
-----------------

\\(\Lambda^1\\) must be a function of \\(\Lambda^2\\) for *any* generative model \\(M_2\\) which agrees on the predictive distribution. So, here’s one graphical structure for a simple model \\(M_2\\) which agrees on the predictive distribution:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXeEo3Slky1ptC8anuvuvkvdgNwpZ43nVSrBX7c_HxjTksIVwoJxKs0tL4v_DrspkQx0x0sNTRDXBtz2EpWQZHy5ex2hObeQBMQ3hCcNPm7kOU5gzEtURxPl396WCqvvQcNAc2uiP8ikf4wSAYVJRPhAQ7A?key=IQLvP8ifNLtM6SeDgu9cOA)

In English: we take \\(\Lambda^2\\) to be \\(X_\bar{i}\\), i.e. all but the \\(i^{th}\\) feature. Since the features are always independent given all but one of them (because any random variables are independent given all but one of them), \\(X_\bar{i}\\) is a valid choice of latent \\(\Lambda^2\\). And since \\(\Lambda^1\\) must be a function of \\(\Lambda^2\\) for any valid choice of \\(\Lambda^2\\), we conclude that \\(\Lambda^1\\) must be a function of \\(X_\bar{i}\\). Graphically, this implies

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXeS5fX-z--Mce2C8qf5Ayg-mAqSkETrbWU7JEToy6WU5po5ESkWAGh6W4gd1KUBKlal943ySxDknr8DZQqSU6ukiWcAqNHoNPqpcRS29SK9nstqOooCuS7F_A0pGIppm-k4zKtHtK1Jme6eFmKMfTI8sNI?key=IQLvP8ifNLtM6SeDgu9cOA)

By repeating the argument, we conclude that the same must apply for all \\(i\\):

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXfClD-mxh9MsYqSmUkoTeWUIqEu_plSePeZJ_hcau8dcoSpa00C5j5xNJlcW6QnZQdZxFUUqMc45UFyDO9GUMsTMHrRch7ZVOJkZyWIt4W062widqyWCp6PcGi6aX7mc8hBo1Ao1SVivTs4k8ifNolq3utc?key=IQLvP8ifNLtM6SeDgu9cOA)

Now we’ve shown that, in order to *guarantee* that \\(\Lambda^1\\) is a function of \\(\Lambda^2\\) for *any* valid choice of \\(\Lambda^2\\), and for \\(\Lambda^1\\) to account for all interactions between the features in the first place, \\(\Lambda^1\\) must satisfy at least the conditions:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXcZycZQww_mC4KAkQghyVCIMqxB_cXZhLIkJNQDTLgYppB3y0Fr08dlJDmIyxLyDKf4kTwR8MuPYY7_SS2BViO0ZdFOqTQnL6HivtntxvcdMyAoHjanTB08QIP4WxSFl3xFc2MXVdZkt1_Sz-n5pW7c2Dne?key=IQLvP8ifNLtM6SeDgu9cOA)

… which are exactly the (weak) [natural latent conditions](https://www.lesswrong.com/posts/dWQWzGCSFj6GTZHz7/natural-latents-the-math#Natural_Latents1), i.e. \\(\Lambda^1\\) *mediates* between all \\(X_i\\)’s and all information about \\(\Lambda^1\\) is *redundantly represented* across the \\(X_i\\)’s. From the standard [Fundamental Theorem of Natural Latents](https://www.lesswrong.com/posts/dWQWzGCSFj6GTZHz7/natural-latents-the-math#The_Fundamental_Theorem), we also know that the natural latent conditions are almost sufficient[^nza7th2blxg]: they don’t quite guarantee that \\(\Lambda^1\\) is a function of \\(\Lambda^2\\), but they guarantee that \\(\Lambda^1\\) is a *stochastic function* of \\(\Lambda^2\\), i.e. \\(\Lambda^1\\) can be computed from \\(\Lambda^2\\) plus some noise which is independent of everything else (and in particular the noise is independent of \\(X\\)).

… so if we go back up top and allow for \\(\Lambda^1\\) to be a stochastic function of \\(\Lambda^2\\), rather than just a function, then the natural latent conditions provide necessary and sufficient conditions for the guarantee which we want.

Approximation
-------------

Since we’re basically just invoking the Fundamental Theorem of Natural Latents, we might as well check how the argument behaves under approximation.

The standard approximation results allow us to relax both the mediation and redundancy conditions. So, we can weaken the requirement that the latents *exactly* mediate between features under each model to allow for *approximate* mediation, and we can weaken the requirement that information about \\(\Lambda^1\\) be *exactly* redundantly represented to allow for *approximately* redundant representation. In both cases, we use the KL-divergences associated with the relevant graphs in the previous sections to quantify the approximation. The standard results then say that \\(\Lambda^1\\) is approximately a stochastic function of \\(\Lambda^2\\), i.e. \\(\Lambda^2\\) contains all the information about \\(X\\) relevant to \\(\Lambda^1\\) to within the approximation bound (measured in bits).

The main remaining loophole is the tiny mixtures problem: arguably-small differences in the two agents’ predictive distributions can sometimes allow large failures in the theorems. On the other hand, our two hypothetical agents could in-principle resolve such differences via experiment, since they involve different predictions.

Why Is This Interesting?
------------------------

This argument was one of our earliest motivators for natural latents. It’s still the main argument we have which singles out natural latents *in particular* \- i.e. the conclusion says that the natural latent conditions are not only *sufficient* for the property we want, but *necessary*. Natural latents are the only way to achieve the guarantee we want, that our latent can be expressed in terms of *any* other latents which explain all interactions between features in the predictive distribution.

[^nza7th2blxg]: Note that, in invoking the Fundamental Theorem, we also implicitly put weight on the assumption that the two agents' latents have nothing to do with each other except via the data. That particular assumption can be circumvented or replaced in multiple ways - e.g. we could instead construct a new latent via resampling, or we could add an assumption that either \(\Lambda^1\) or \(\Lambda^2\) has low entropy given \(X\).