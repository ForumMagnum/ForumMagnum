import ReviewWinners from "../../lib/collections/reviewWinners/collection";
import { updateMutator } from "../vulcan-lib/mutators";
import { createAdminContext } from "../vulcan-lib/query";
import { registerMigration } from "./migrationUtils";

type ReviewWinnerCategoryAndOrder = {
  id: string;
  title?: string;
  category: DbReviewWinner['category'];
  curatedOrder: number;
}

const reviewWinnerCategories: ReviewWinnerCategoryAndOrder[] = [
  {
    "id": "htrZrxduciZ5QaCjw",
    "title": "Language models seem to be much better than humans at next-token prediction",
    "category": "ai safety",
    "curatedOrder": 32
  },
  {
    "id": "xFotXGEotcKouifky",
    "title": "Worlds Where Iterative Design Fails",
    "category": "ai safety",
    "curatedOrder": 18
  },
  {
    "id": "Ke2ogqSEhL2KCJCNx",
    "title": "Security Mindset: Lessons from 20+ years of Software Security Failures Relevant to AGI Alignment",
    "category": "ai safety",
    "curatedOrder": 15
  },
  {
    "id": "PqMT9zGrNsGJNfiFR",
    "title": "Alignment Research Field Guide",
    "category": "ai safety",
    "curatedOrder": 30
  },
  {
    "id": "S7csET9CgBtpi7sCh",
    "title": "Challenges to Christiano's capability amplification proposal",
    "category": "ai safety",
    "curatedOrder": 53
  },
  {
    "id": "p7x32SEt43ZMC9r7r",
    "title": "Embedded Agents",
    "category": "ai safety",
    "curatedOrder": 37
  },
  {
    "id": "CvKnhXTu9BPcdKE4W",
    "title": "An Untrollable Mathematician Illustrated",
    "category": "ai safety",
    "curatedOrder": 33
  },
  {
    "id": "ZDZmopKquzHYPRNxq",
    "title": "Selection vs Control",
    "category": "ai safety",
    "curatedOrder": 22
  },
  {
    "id": "Gg9a4y8reWKtLe3Tn",
    "title": "The Rocket Alignment Problem",
    "category": "ai safety",
    "curatedOrder": 4
  },
  {
    "id": "RQpNHSiWaXTvDxt6R",
    "title": "Coherent decisions imply consistent utilities",
    "category": "ai safety",
    "curatedOrder": 42
  },
  {
    "id": "FkgsxrGf3QxhfLWHG",
    "title": "Risks from Learned Optimization: Introduction",
    "category": "ai safety",
    "curatedOrder": 38
  },
  {
    "id": "FRv7ryoqtvSuqBxuT",
    "title": "Understanding “Deep Double Descent”",
    "category": "ai safety",
    "curatedOrder": 50
  },
  {
    "id": "uXH4r6MmKPedk8rMA",
    "title": "Gradient hacking",
    "category": "ai safety",
    "curatedOrder": 44
  },
  {
    "id": "nyCHnY7T5PHPLjxmN",
    "title": "Open question: are minimal circuits daemon-free?",
    "category": "ai safety",
    "curatedOrder": 43
  },
  {
    "id": "nRAMpjnb6Z4Qv3imF",
    "title": "The strategy-stealing assumption",
    "category": "ai safety",
    "curatedOrder": 7
  },
  {
    "id": "NxF5G6CJiof6cemTw",
    "title": "Coherence arguments do not entail goal-directed behavior",
    "category": "ai safety",
    "curatedOrder": 36
  },
  {
    "id": "bBdfbWfWxHN9Chjcq",
    "title": "Robustness to Scale",
    "category": "ai safety",
    "curatedOrder": 26
  },
  {
    "id": "6DuJxY8X45Sco4bS2",
    "title": "Seeking Power is Often Convergently Instrumental in MDPs",
    "category": "ai safety",
    "curatedOrder": 28
  },
  {
    "id": "xCxeBSHqMEaP3jDvY",
    "title": "Reframing Impact",
    "category": "ai safety",
    "curatedOrder": 25
  },
  {
    "id": "Djs38EWYZG8o7JMWY",
    "title": "Paul's research agenda FAQ",
    "category": "ai safety",
    "curatedOrder": 41
  },
  {
    "id": "Nwgdq6kHke5LY692J",
    "title": "Alignment By Default",
    "category": "ai safety",
    "curatedOrder": 19
  },
  {
    "id": "Tr7tAyt5zZpdTwTQK",
    "title": "The Solomonoff Prior is Malign",
    "category": "ai safety",
    "curatedOrder": 23
  },
  {
    "id": "gQY6LrTWJNkTv8YJR",
    "title": "The Pointers Problem: Human Values Are A Function Of Humans' Latent Variables",
    "category": "ai safety",
    "curatedOrder": 31
  },
  {
    "id": "ZyWyAJbedvEgRT2uF",
    "title": "Inaccessible information",
    "category": "ai safety",
    "curatedOrder": 27
  },
  {
    "id": "A8iGaZ3uHNNGgJeaD",
    "title": "An Orthodox Case Against Utility Functions",
    "category": "ai safety",
    "curatedOrder": 34
  },
  {
    "id": "zB4f7QqKhBHa5b37a",
    "title": "Introduction To The Infra-Bayesianism Sequence",
    "category": "ai safety",
    "curatedOrder": 95
  },
  {
    "id": "qHCDysDnvhteW7kRd",
    "title": "ARC's first technical report: Eliciting Latent Knowledge",
    "category": "ai safety",
    "curatedOrder": 94
  },
  {
    "id": "N5Jm6Nj4HkNKySA5Z",
    "title": "Finite Factored Sets",
    "category": "ai safety",
    "curatedOrder": 93
  },
  {
    "id": "G2Lne2Fi7Qra5Lbuf",
    "title": "Selection Theorems: A Program For Understanding Agents",
    "category": "ai safety",
    "curatedOrder": 35
  },
  {
    "id": "gHefoxiznGfsbiAu9",
    "title": "Inner and outer alignment decompose one hard problem into two extremely hard problems",
    "category": "ai safety",
    "curatedOrder": 52
  },
  {
    "id": "vJFdjigzmcXMhNTsx",
    "title": "Simulators",
    "category": "ai safety",
    "curatedOrder": 45
  },
  {
    "id": "6Fpvch8RR29qLEWNH",
    "title": "chinchilla's wild implications",
    "category": "ai safety",
    "curatedOrder": 39
  },
  {
    "id": "N6WM6hs7RQMKDhYjB",
    "title": "A Mechanistic Interpretability Analysis of Grokking",
    "category": "ai safety",
    "curatedOrder": 48
  },
  {
    "id": "JvZhhzycHu2Yd57RN",
    "title": "Causal Scrubbing: a method for rigorously testing interpretability hypotheses [Redwood Research]",
    "category": "ai safety",
    "curatedOrder": 46
  },
  {
    "id": "CjFZeDD6iCnNubDoS",
    "title": "Humans provide an untapped wealth of evidence about alignment",
    "category": "ai safety",
    "curatedOrder": 47
  },
  {
    "id": "iCfdcxiyr2Kj8m8mT",
    "title": "The shard theory of human values",
    "category": "ai safety",
    "curatedOrder": 51
  },
  {
    "id": "L4anhrxjv8j2yRKKp",
    "title": "How \"Discovering Latent Knowledge in Language Models Without Supervision\" Fits Into a Broader Alignment Scheme",
    "category": "ai safety",
    "curatedOrder": 49
  },
  {
    "id": "AanbbjYr5zckMKde7",
    "title": "Specification gaming examples in AI",
    "category": "ai safety",
    "curatedOrder": 1
  },
  {
    "id": "fRsjBseRuvRhMPPE5",
    "title": "An overview of 11 proposals for building safe advanced AI",
    "category": "ai safety",
    "curatedOrder": 3
  },
  {
    "id": "znfkdCoHMANwqc2WE",
    "title": "The ground of optimization",
    "category": "ai safety",
    "curatedOrder": 10
  },
  {
    "id": "AHhCrJ2KpTjsCSwbt",
    "title": "Inner Alignment: Explain like I'm 12 Edition",
    "category": "ai safety",
    "curatedOrder": 2
  },
  {
    "id": "hvGoYXi2kgnS3vxqb",
    "title": "Some AI research areas and their relevance to existential safety",
    "category": "ai safety",
    "curatedOrder": 13
  },
  {
    "id": "r3NHPD3dLFNk9QE2Y",
    "title": "Search versus design",
    "category": "ai safety",
    "curatedOrder": 21
  },
  {
    "id": "7im8at9PmhbT4JHsW",
    "title": "Ngo and Yudkowsky on alignment difficulty",
    "category": "ai safety",
    "curatedOrder": 12
  },
  {
    "id": "EF5M6CmKRd6qZk27Z",
    "title": "My research methodology",
    "category": "ai safety",
    "curatedOrder": 24
  },
  {
    "id": "mRwJce3npmzbKfxws",
    "title": "EfficientZero: How It Works",
    "category": "ai safety",
    "curatedOrder": 14
  },
  {
    "id": "uMQ3cqWDPHhjtiesc",
    "title": "AGI Ruin: A List of Lethalities",
    "category": "ai safety",
    "curatedOrder": 5
  },
  {
    "id": "CoZhXrhpQxpy9xw9y",
    "title": "Where I agree and disagree with Eliezer",
    "category": "ai safety",
    "curatedOrder": 11
  },
  {
    "id": "pdaGN6pQyQarFHXF4",
    "title": "Reward is not the optimization target",
    "category": "ai safety",
    "curatedOrder": 17
  },
  {
    "id": "3pinFH3jerMzAvmza",
    "title": "On how various plans miss the hard bits of the alignment challenge",
    "category": "ai safety",
    "curatedOrder": 29
  },
  {
    "id": "kpPnReyBC54KESiSn",
    "title": "Optimality is the tiger, and agents are its teeth",
    "category": "ai safety",
    "curatedOrder": 8
  },
  {
    "id": "rP66bz34crvDudzcJ",
    "title": "Decision theory does not imply that we get to have nice things",
    "category": "ai safety",
    "curatedOrder": 16
  },
  {
    "id": "TWorNr22hhYegE4RT",
    "title": "Models Don't \"Get Reward",
    "category": "ai safety",
    "curatedOrder": 9
  },
  {
    "id": "w4aeAFzSAguvqA5qu",
    "title": "How To Go From Interpretability To Alignment: Just Retarget The Search",
    "category": "ai safety",
    "curatedOrder": 20
  },
  {
    "id": "FWvzwCDRgcjb9sigb",
    "title": "Why Agent Foundations? An Overly Abstract Explanation",
    "category": "ai safety",
    "curatedOrder": 40
  },
  {
    "id": "GNhMPAWcfBCASy8e6",
    "title": "A central AI alignment problem: capabilities generalization, and the sharp left turn",
    "category": "ai safety",
    "curatedOrder": 6
  },
  {
    "id": "xhD6SHAAE9ghKZ9HS",
    "title": "Safetywashing",
    "category": "ai strategy",
    "curatedOrder": 7
  },
  {
    "id": "ZFtesgbY9XwtqqyZ5",
    "title": "human psycholinguists: a critical appraisal",
    "category": "ai strategy",
    "curatedOrder": 28
  },
  {
    "id": "KrJfoZzpSDpnrv9va",
    "title": "Draft report on AI timelines",
    "category": "ai strategy",
    "curatedOrder": 18
  },
  {
    "id": "ivpKSjM4D6FbqF4pZ",
    "title": "Cortés, Pizarro, and Afonso as Precedents for Takeover",
    "category": "ai strategy",
    "curatedOrder": 14
  },
  {
    "id": "aFaKhG86tTrKvtAnT",
    "title": "Against GDP as a metric for timelines and takeoff speeds",
    "category": "ai strategy",
    "curatedOrder": 10
  },
  {
    "id": "JPan54R525D68NoEt",
    "title": "The date of AI Takeover is not the day the AI takes over",
    "category": "ai strategy",
    "curatedOrder": 15
  },
  {
    "id": "rzqACeBGycZtqCfaX",
    "title": "Fun with +12 OOMs of Compute",
    "category": "ai strategy",
    "curatedOrder": 4
  },
  {
    "id": "6Xgy6CAf2jqHhynHL",
    "title": "What 2026 looks like",
    "category": "ai strategy",
    "curatedOrder": 2
  },
  {
    "id": "pv7Qpu8WSge8NRbpB",
    "title": "larger language models may disappoint you [or, an eternally unfinished draft]",
    "category": "ai strategy",
    "curatedOrder": 29
  },
  {
    "id": "cCMihiwtZx7kdcKgt",
    "title": "Comments on Carlsmith's “Is power-seeking AI an existential risk?”",
    "category": "ai strategy",
    "curatedOrder": 27
  },
  {
    "id": "a5e9arCnbDac9Doig",
    "title": "It Looks Like You're Trying To Take Over The World",
    "category": "ai strategy",
    "curatedOrder": 3
  },
  {
    "id": "pRkFkzwKZ2zfa3R6H",
    "title": "Without specific countermeasures, the easiest path to transformative AI likely leads to AI takeover",
    "category": "ai strategy",
    "curatedOrder": 13
  },
  {
    "id": "j9Q8bRmwCgXRYAgcJ",
    "title": "MIRI announces new \"Death With Dignity\" strategy",
    "category": "ai strategy",
    "curatedOrder": 25
  },
  {
    "id": "uFNgRumrDTpBfQGrs",
    "title": "Let’s think about slowing down AI",
    "category": "ai strategy",
    "curatedOrder": 9
  },
  {
    "id": "keiYkaeoLHoKK4LYA",
    "title": "Six Dimensions of Operational Adequacy in AGI Projects",
    "category": "ai strategy",
    "curatedOrder": 12
  },
  {
    "id": "kipMvuaK3NALvFHc9",
    "title": "What an actually pessimistic containment strategy looks like",
    "category": "ai strategy",
    "curatedOrder": 24
  },
  {
    "id": "LpM3EAakwYdS6aRKf",
    "title": "What Multipolar Failure Looks Like, and Robust Agent-Agnostic Processes (RAAPs)",
    "category": "ai strategy",
    "curatedOrder": 16
  },
  {
    "id": "ax695frGJEzGxFBK4",
    "title": "Biology-Inspired AGI Timelines: The Trick That Never Works",
    "category": "ai strategy",
    "curatedOrder": 19
  },
  {
    "id": "nNqXfnjiezYukiMJi",
    "title": "Reply to Eliezer on Biological Anchors",
    "category": "ai strategy",
    "curatedOrder": 20
  },
  {
    "id": "SwcyMEgLyd4C3Dern",
    "title": "The Parable of Predict-O-Matic",
    "category": "ai strategy",
    "curatedOrder": 8
  },
  {
    "id": "X2i9dQQK3gETCyqh2",
    "title": "Chris Olah’s views on AGI safety",
    "category": "ai strategy",
    "curatedOrder": 26
  },
  {
    "id": "AfGmsjGPXN97kNp57",
    "title": "Arguments about fast takeoff",
    "category": "ai strategy",
    "curatedOrder": 11
  },
  {
    "id": "HBxe6wdjxK239zajf",
    "title": "What failure looks like",
    "category": "ai strategy",
    "curatedOrder": 1
  },
  {
    "id": "x3fNwSe5aWZb5yXEG",
    "title": "Reframing Superintelligence: Comprehensive AI Services as General Intelligence",
    "category": "ai strategy",
    "curatedOrder": 23
  },
  {
    "id": "bnY3L48TtDrKTzGRb",
    "title": "AI Safety \"Success Stories",
    "category": "ai strategy",
    "curatedOrder": 5
  },
  {
    "id": "8xRSjC76HasLnMGSf",
    "title": "AGI safety from first principles: Introduction",
    "category": "ai strategy",
    "curatedOrder": 21
  },
  {
    "id": "AyNHoTWWAJ5eb99ji",
    "title": "Another (outer) alignment failure story",
    "category": "ai strategy",
    "curatedOrder": 17
  },
  {
    "id": "3L46WGauGpr7nYubu",
    "title": "The Plan",
    "category": "ai strategy",
    "curatedOrder": 22
  },
  {
    "id": "LDRQ5Zfqwi8GjzPYG",
    "title": "Counterarguments to the basic AI x-risk case",
    "category": "ai strategy",
    "curatedOrder": 6
  },
  {
    "id": "XYYyzgyuRH5rFN64K",
    "title": "What makes people intellectually active?",
    "category": "modeling",
    "curatedOrder": 35
  },
  {
    "id": "NQgWL7tvAPgN2LTLn",
    "title": "Spaghetti Towers",
    "category": "modeling",
    "curatedOrder": 5
  },
  {
    "id": "PrCmeuBPC4XLDQz8C",
    "title": "Unconscious Economics",
    "category": "modeling",
    "curatedOrder": 25
  },
  {
    "id": "mELQFMi9egPn5EAjK",
    "title": "My attempt to explain Looking, insight meditation, and enlightenment in non-mysterious terms",
    "category": "modeling",
    "curatedOrder": 31
  },
  {
    "id": "i9xyZBS3qzA8nFXNQ",
    "title": "Book summary: Unlocking the Emotional Brain",
    "category": "modeling",
    "curatedOrder": 13
  },
  {
    "id": "X5RyaEDHNq5qutSHK",
    "title": "Anti-social Punishment",
    "category": "modeling",
    "curatedOrder": 3
  },
  {
    "id": "BhXA6pvAbsFz3gvn4",
    "title": "Research: Rescuers during the Holocaust",
    "category": "modeling",
    "curatedOrder": 20
  },
  {
    "id": "nnNdz7XQrd5bWTgoP",
    "title": "On the Loss and Preservation of Knowledge",
    "category": "modeling",
    "curatedOrder": 15
  },
  {
    "id": "v7c47vjta3mavY3QC",
    "title": "Is Science Slowing Down?",
    "category": "modeling",
    "curatedOrder": 2
  },
  {
    "id": "Zm7WAJMTaFvuh2Wc7",
    "title": "Book Review: The Secret Of Our Success",
    "category": "modeling",
    "curatedOrder": 26
  },
  {
    "id": "AqbWna2S85pFTsHH4",
    "title": "The Intelligent Social Web",
    "category": "modeling",
    "curatedOrder": 24
  },
  {
    "id": "YABJKJ3v97k9sbxwg",
    "title": "What Money Cannot Buy",
    "category": "modeling",
    "curatedOrder": 7
  },
  {
    "id": "diruo47z32eprenTg",
    "title": "My computational framework for the brain",
    "category": "modeling",
    "curatedOrder": 33
  },
  {
    "id": "RcifQCKkRc9XTjxC2",
    "title": "Anti-Aging: State of the Art",
    "category": "modeling",
    "curatedOrder": 11
  },
  {
    "id": "hyShz2ABiKX56j5tJ",
    "title": "Interfaces as a Scarce Resource",
    "category": "modeling",
    "curatedOrder": 18
  },
  {
    "id": "WFopenhCXyHX3ukw3",
    "title": "How uniform is the neocortex?",
    "category": "modeling",
    "curatedOrder": 10
  },
  {
    "id": "x6hpkYyzMG6Bf8T3W",
    "title": "Swiss Political System: More than You ever Wanted to Know (I.)",
    "category": "modeling",
    "curatedOrder": 17
  },
  {
    "id": "4s2gbwMHSdh2SByyZ",
    "title": "Transportation as a Constraint",
    "category": "modeling",
    "curatedOrder": 19
  },
  {
    "id": "4XRjPocTprL4L8tmB",
    "title": "Science in a High-Dimensional World",
    "category": "modeling",
    "curatedOrder": 9
  },
  {
    "id": "fRwdkop6tyhi3d22L",
    "title": "There’s no such thing as a tree (phylogenetically)",
    "category": "modeling",
    "curatedOrder": 1
  },
  {
    "id": "CSZnj2YNMKGfsMbZA",
    "title": "Specializing in Problems We Don't Understand",
    "category": "modeling",
    "curatedOrder": 27
  },
  {
    "id": "REA49tL5jsh69X3aM",
    "title": "Introduction to abstract entropy",
    "category": "modeling",
    "curatedOrder": 16
  },
  {
    "id": "J3wemDGtsy5gzD3xa",
    "title": "Toni Kurz and the Insanity of Climbing Mountains",
    "category": "modeling",
    "curatedOrder": 21
  },
  {
    "id": "sbcmACvB6DqYXYidL",
    "title": "Counter-theses on Sleep",
    "category": "modeling",
    "curatedOrder": 34
  },
  {
    "id": "JJFphYfMsdFMuprBy",
    "title": "Mental Mountains",
    "category": "modeling",
    "curatedOrder": 30
  },
  {
    "id": "f2GF3q6fgyx8TqZcn",
    "title": "Literature Review: Distributed Teams",
    "category": "modeling",
    "curatedOrder": 23
  },
  {
    "id": "fnkbdwckdfHS2H22Q",
    "title": "Steelmanning Divination",
    "category": "modeling",
    "curatedOrder": 12
  },
  {
    "id": "5gfqG3Xcopscta3st",
    "title": "Building up to an Internal Family Systems model",
    "category": "modeling",
    "curatedOrder": 32
  },
  {
    "id": "bNXdnRTpSXk9p4zmi",
    "title": "Book Review: Design Principles of Biological Circuits",
    "category": "modeling",
    "curatedOrder": 22
  },
  {
    "id": "JBFHzfPkXHB2XfDGj",
    "title": "Evolution of Modularity",
    "category": "modeling",
    "curatedOrder": 8
  },
  {
    "id": "8SEvTvYFX2KDRZjti",
    "title": "[Answer] Why wasn't science invented in China?",
    "category": "modeling",
    "curatedOrder": 29
  },
  {
    "id": "mFqG58s4NE3EE68Lq",
    "title": "Why did everything take so long?",
    "category": "modeling",
    "curatedOrder": 28
  },
  {
    "id": "tj8QP2EFdP8p54z6i",
    "title": "Historical mathematicians exhibit a birth order effect too",
    "category": "modeling",
    "curatedOrder": 6
  },
  {
    "id": "QTLTic5nZ2DaBtoCv",
    "title": "Birth order effect found in Nobel Laureates in Physics",
    "category": "modeling",
    "curatedOrder": 36
  },
  {
    "id": "vLRxmYCKpmZAAJ3KC",
    "title": "Elephant seal 2",
    "category": "modeling",
    "curatedOrder": 37
  },
  {
    "id": "CKgPFHoWFkviYz7CB",
    "title": "The Redaction Machine",
    "category": "modeling",
    "curatedOrder": 14
  },
  {
    "id": "vKErZy7TFhjxtyBuG",
    "title": "Make more land",
    "category": "optimization",
    "curatedOrder": 37
  },
  {
    "id": "ygFc4caQ6Nws62dSW",
    "title": "Bioinfohazards",
    "category": "optimization",
    "curatedOrder": 22
  },
  {
    "id": "q3JY4iRzjq56FyjGF",
    "title": "Why haven't we celebrated any major achievements lately?",
    "category": "optimization",
    "curatedOrder": 29
  },
  {
    "id": "niQ3heWwF6SydhS7R",
    "title": "Making Vaccine",
    "category": "optimization",
    "curatedOrder": 36
  },
  {
    "id": "nSjavaKcBrtNktzGa",
    "title": "Nonprofit Boards are Weird",
    "category": "optimization",
    "curatedOrder": 34
  },
  {
    "id": "N9oKuQKuf7yvCCtfq",
    "title": "Can crimes be discussed literally?",
    "category": "optimization",
    "curatedOrder": 25
  },
  {
    "id": "o4cgvYmNZnfS4xhxL",
    "title": "Working With Monsters",
    "category": "optimization",
    "curatedOrder": 28
  },
  {
    "id": "Ajcq9xWi2fmgn8RBJ",
    "title": "The Credit Assignment Problem",
    "category": "optimization",
    "curatedOrder": 30
  },
  {
    "id": "kKSFsbjdX3kxsYaTM",
    "title": "Simple Rules of Law",
    "category": "optimization",
    "curatedOrder": 19
  },
  {
    "id": "YicoiQurNBxSp7a65",
    "title": "Is Clickbait Destroying Our General Intelligence?",
    "category": "optimization",
    "curatedOrder": 21
  },
  {
    "id": "P6fSj3t4oApQQTB7E",
    "title": "Coordination as a Scarce Resource",
    "category": "optimization",
    "curatedOrder": 14
  },
  {
    "id": "CeZXDmp8Z363XaM6b",
    "title": "Discontinuous progress in history: an update",
    "category": "optimization",
    "curatedOrder": 10
  },
  {
    "id": "sT6NxFxso6Z9xjS7o",
    "title": "Nuclear war is unlikely to cause human extinction",
    "category": "optimization",
    "curatedOrder": 6
  },
  {
    "id": "5FZxhdi6hZp8QwK7k",
    "title": "This Can't Go On",
    "category": "optimization",
    "curatedOrder": 8
  },
  {
    "id": "DQKgYhEYP86PLW7tZ",
    "title": "How factories were made safe",
    "category": "optimization",
    "curatedOrder": 16
  },
  {
    "id": "F5ktR95qqpmGXXmLq",
    "title": "All Possible Views About Humanity's Future Are Wild",
    "category": "optimization",
    "curatedOrder": 17
  },
  {
    "id": "ThvvCE2HsLohJYd7b",
    "title": "Why has nuclear power been a flop?",
    "category": "optimization",
    "curatedOrder": 18
  },
  {
    "id": "9fB4gvoooNYa4t56S",
    "title": "Power Buys You Distance From The Crime",
    "category": "optimization",
    "curatedOrder": 20
  },
  {
    "id": "XvN2QQpKTuEzgkZHY",
    "title": "Being the (Pareto) Best in the World",
    "category": "optimization",
    "curatedOrder": 2
  },
  {
    "id": "2G8j8D5auZKKAjSfY",
    "title": "Inadequate Equilibria vs. Governance of the Commons",
    "category": "optimization",
    "curatedOrder": 31
  },
  {
    "id": "36Dhz325MZNq3Cs6B",
    "title": "The Amish, and Strategic Norms around Technology",
    "category": "optimization",
    "curatedOrder": 32
  },
  {
    "id": "duxy4Hby5qMsv42i8",
    "title": "The Real Rules Have No Exceptions",
    "category": "optimization",
    "curatedOrder": 26
  },
  {
    "id": "3rxMBRCYEmHCNDLhu",
    "title": "The Pavlov Strategy",
    "category": "optimization",
    "curatedOrder": 13
  },
  {
    "id": "u8GMcpEN9Z6aQiCvp",
    "title": "Rule Thinkers In, Not Out",
    "category": "optimization",
    "curatedOrder": 11
  },
  {
    "id": "asmZvCPHcB4SkSCMW",
    "title": "The Tails Coming Apart As Metaphor For Life",
    "category": "optimization",
    "curatedOrder": 4
  },
  {
    "id": "Qz6w4GYZpgeDp6ATB",
    "title": "Beyond Astronomical Waste",
    "category": "optimization",
    "curatedOrder": 35
  },
  {
    "id": "a4jRN9nbD79PAhWTB",
    "title": "Prediction Markets: When Do They Work?",
    "category": "optimization",
    "curatedOrder": 1
  },
  {
    "id": "YRgMCXMbkKBZgMz4M",
    "title": "Asymmetric Justice",
    "category": "optimization",
    "curatedOrder": 5
  },
  {
    "id": "ham9i5wf4JCexXnkN",
    "title": "Moloch Hasn’t Won",
    "category": "optimization",
    "curatedOrder": 23
  },
  {
    "id": "EYd63hYSzadcNnZTD",
    "title": "Blackmail",
    "category": "optimization",
    "curatedOrder": 33
  },
  {
    "id": "wEebEiPpEwjYvnyqq",
    "title": "When Money Is Abundant, Knowledge Is The Real Wealth",
    "category": "optimization",
    "curatedOrder": 7
  },
  {
    "id": "XtRAkvvaQSaQEyASj",
    "title": "Lars Doucet's Georgism series on Astral Codex Ten",
    "category": "optimization",
    "curatedOrder": 27
  },
  {
    "id": "mmHctwkKjpvaQdC3c",
    "title": "What should you change in response to an \"emergency\"? And AI risk",
    "category": "optimization",
    "curatedOrder": 15
  },
  {
    "id": "D4hHASaZuLCW92gMy",
    "title": "Is Success the Enemy of Freedom? (Full)",
    "category": "optimization",
    "curatedOrder": 3
  },
  {
    "id": "L6Ktf952cwdMJnzWm",
    "title": "Motive Ambiguity",
    "category": "optimization",
    "curatedOrder": 24
  },
  {
    "id": "GZSzMqr8hAB2dR8pk",
    "title": "Studies On Slack",
    "category": "optimization",
    "curatedOrder": 9
  },
  {
    "id": "D6trAzh6DApKPhbv4",
    "title": "A voting theory primer for rationalists",
    "category": "optimization",
    "curatedOrder": 12
  },
  {
    "id": "rBkZvbGDQZhEymReM",
    "title": "Forum participation as a research strategy",
    "category": "practical",
    "curatedOrder": 19
  },
  {
    "id": "Cf2xxC3Yx9g6w7yXN",
    "title": "Notes from \"Don't Shoot the Dog",
    "category": "practical",
    "curatedOrder": 14
  },
  {
    "id": "4EGYhyyJXSnE7xJ9H",
    "title": "In My Culture",
    "category": "practical",
    "curatedOrder": 13
  },
  {
    "id": "TPjbTXntR54XSZ3F2",
    "title": "Paper-Reading for Gears",
    "category": "practical",
    "curatedOrder": 18
  },
  {
    "id": "B2CfMNfay2P8f2yyc",
    "title": "The Loudest Alarm Is Probably False",
    "category": "practical",
    "curatedOrder": 11
  },
  {
    "id": "E4zGWYzh6ZiG85b2z",
    "title": "The Curse Of The Counterfactual",
    "category": "practical",
    "curatedOrder": 21
  },
  {
    "id": "4ZvJab25tDebB8FGE",
    "title": "You Get About Five Words",
    "category": "practical",
    "curatedOrder": 7
  },
  {
    "id": "cM8GNMpzfKCkPnd5v",
    "title": "Do you fear the rock or the hard place?",
    "category": "practical",
    "curatedOrder": 26
  },
  {
    "id": "ximou2kyQorm6MPjX",
    "title": "Rest Days vs Recovery Days",
    "category": "practical",
    "curatedOrder": 3
  },
  {
    "id": "KwdcMts8P8hacqwrX",
    "title": "Noticing the Taste of Lotus",
    "category": "practical",
    "curatedOrder": 10
  },
  {
    "id": "krarE7WFijAtHf3hm",
    "title": "microCOVID.org: A tool to estimate COVID risk from common activities",
    "category": "practical",
    "curatedOrder": 30
  },
  {
    "id": "rz73eva3jv267Hy7B",
    "title": "Can you keep this confidential? How do you know?",
    "category": "practical",
    "curatedOrder": 12
  },
  {
    "id": "4K5pJnKBGkqqTbyxx",
    "title": "To listen well, get curious",
    "category": "practical",
    "curatedOrder": 6
  },
  {
    "id": "MzKKi7niyEqkBPnyu",
    "title": "Your Cheerful Price",
    "category": "practical",
    "curatedOrder": 5
  },
  {
    "id": "2cYebKxNp47PapHTL",
    "title": "Cryonics signup guide #1: Overview",
    "category": "practical",
    "curatedOrder": 29
  },
  {
    "id": "tTWL6rkfEuQN9ivxj",
    "title": "Leaky Delegation: You are not a Commodity",
    "category": "practical",
    "curatedOrder": 22
  },
  {
    "id": "vzfz4AS6wbooaTeQk",
    "title": "Staring into the abyss as a core life skill",
    "category": "practical",
    "curatedOrder": 2
  },
  {
    "id": "fFY2HeC9i2Tx8FEnK",
    "title": "Luck based medicine: my resentful story of becoming a medical miracle",
    "category": "practical",
    "curatedOrder": 15
  },
  {
    "id": "ma7FSEtumkve8czGF",
    "title": "Losing the root for the tree",
    "category": "practical",
    "curatedOrder": 23
  },
  {
    "id": "R6M4vmShiowDn56of",
    "title": "Butterfly Ideas",
    "category": "practical",
    "curatedOrder": 4
  },
  {
    "id": "2MiDpjWraeL5bypRE",
    "title": "Useful Vices for Wicked Problems",
    "category": "practical",
    "curatedOrder": 20
  },
  {
    "id": "ii4xtogen7AyYmN6B",
    "title": "Learning By Writing",
    "category": "practical",
    "curatedOrder": 8
  },
  {
    "id": "nTGEeRSZrfPiJwkEc",
    "title": "The Onion Test for Personal and Institutional Honesty",
    "category": "practical",
    "curatedOrder": 24
  },
  {
    "id": "Psr9tnQFuEXiuqGcR",
    "title": "How To Write Quickly While Maintaining Epistemic Rigor",
    "category": "practical",
    "curatedOrder": 16
  },
  {
    "id": "bx3gkHJehRCYZAF3r",
    "title": "Pain is not the unit of Effort",
    "category": "practical",
    "curatedOrder": 1
  },
  {
    "id": "SWxnP5LZeJzuT3ccd",
    "title": "“PR” is corrosive; “reputation” is not.",
    "category": "practical",
    "curatedOrder": 25
  },
  {
    "id": "3qX2GipDuCq5jstMG",
    "title": "Slack Has Positive Externalities For Groups",
    "category": "practical",
    "curatedOrder": 27
  },
  {
    "id": "57sq9qA3wurjres4K",
    "title": "Ruling Out Everything Else",
    "category": "practical",
    "curatedOrder": 17
  },
  {
    "id": "Jk9yMXpBLMWNTFLzh",
    "title": "Limerence Messes Up Your Rationality Real Bad, Yo",
    "category": "practical",
    "curatedOrder": 28
  },
  {
    "id": "qc7P2NwfxQMC3hdgm",
    "title": "Rationalism before the Sequences",
    "category": "rationality",
    "curatedOrder": 55
  },
  {
    "id": "DtcbfwSrcewFubjxp",
    "title": "The Rationalists of the 1950s (and before) also called themselves “Rationalists”",
    "category": "rationality",
    "curatedOrder": 56
  },
  {
    "id": "5okDRahtDewnWfFmz",
    "title": "Seeing the Smoke",
    "category": "rationality",
    "curatedOrder": 29
  },
  {
    "id": "Z9cbwuevS9cqaR96h",
    "title": "CFAR Participant Handbook now available to all",
    "category": "rationality",
    "curatedOrder": 19
  },
  {
    "id": "dYspinGtiba5oDCcv",
    "title": "Feature Selection",
    "category": "rationality",
    "curatedOrder": 23
  },
  {
    "id": "SA9hDewwsYgnuscae",
    "title": "ProjectLawful.com: Eliezer's latest story, past 1M words",
    "category": "rationality",
    "curatedOrder": 34
  },
  {
    "id": "t2LGSDwT7zSnAGybG",
    "title": "Split and Commit",
    "category": "rationality",
    "curatedOrder": 18
  },
  {
    "id": "zTfSXQracE7TW8x4w",
    "title": "Mistakes with Conservation of Expected Evidence",
    "category": "rationality",
    "curatedOrder": 25
  },
  {
    "id": "i42Dfoh4HtsCAfXxL",
    "title": "Babble",
    "category": "rationality",
    "curatedOrder": 9
  },
  {
    "id": "9QxnfMYccz9QRgZ5z",
    "title": "The Costly Coordination Mechanism of Common Knowledge",
    "category": "rationality",
    "curatedOrder": 28
  },
  {
    "id": "yeADMcScw8EW9yxpH",
    "title": "A Sketch of Good Communication",
    "category": "rationality",
    "curatedOrder": 4
  },
  {
    "id": "8XDZjfThxDxLvKWiM",
    "title": "Excerpts from a larger discussion about simulacra",
    "category": "rationality",
    "curatedOrder": 50
  },
  {
    "id": "4QemtxDFaGXyGSrGD",
    "title": "Other people are wrong\" vs \"I am right",
    "category": "rationality",
    "curatedOrder": 2
  },
  {
    "id": "WQFioaudEH8R7fyhm",
    "title": "Local Validity as a Key to Sanity and Civilization",
    "category": "rationality",
    "curatedOrder": 1
  },
  {
    "id": "CPP2uLcaywEokFKQG",
    "title": "Toolbox-thinking and Law-thinking",
    "category": "rationality",
    "curatedOrder": 8
  },
  {
    "id": "xdwbX9pFEr7Pomaxv",
    "title": "Meta-Honesty: Firming Up Honesty Around Its Edge-Cases",
    "category": "rationality",
    "curatedOrder": 5
  },
  {
    "id": "xhE4TriBSPywGuhqi",
    "title": "Integrity and accountability are core parts of rationality",
    "category": "rationality",
    "curatedOrder": 43
  },
  {
    "id": "qmXqHKpgRfg83Nif9",
    "title": "How to Ignore Your Emotions (while also thinking you're awesome at emotions)",
    "category": "rationality",
    "curatedOrder": 15
  },
  {
    "id": "nEBbw2Bc2CnN2RMxy",
    "title": "Gears-Level Models are Capital Investments",
    "category": "rationality",
    "curatedOrder": 14
  },
  {
    "id": "2jfiMgKkh7qw9z8Do",
    "title": "Being a Robust Agent",
    "category": "rationality",
    "curatedOrder": 40
  },
  {
    "id": "zp5AEENssb8ZDnoZR",
    "title": "The Schelling Choice is \"Rabbit\", not \"Stag",
    "category": "rationality",
    "curatedOrder": 44
  },
  {
    "id": "f886riNJcArmpFahm",
    "title": "Noticing Frame Differences",
    "category": "rationality",
    "curatedOrder": 12
  },
  {
    "id": "YN6daWakNnkXEeznB",
    "title": "Propagating Facts into Aesthetics",
    "category": "rationality",
    "curatedOrder": 46
  },
  {
    "id": "4ZwGqkMTyAvANYEDw",
    "title": "Naming the Nameless",
    "category": "rationality",
    "curatedOrder": 53
  },
  {
    "id": "NLBbCQeNLFvBJJkrt",
    "title": "Varieties Of Argumentative Experience",
    "category": "rationality",
    "curatedOrder": 7
  },
  {
    "id": "G5TwJ9BGxcgh5DsmQ",
    "title": "Yes Requires the Possibility of No",
    "category": "rationality",
    "curatedOrder": 16
  },
  {
    "id": "DoPo4PDjgSySquHX8",
    "title": "Heads I Win, Tails?—Never Heard of Her; Or, Selective Reporting and the Tragedy of the Green Rationalists",
    "category": "rationality",
    "curatedOrder": 41
  },
  {
    "id": "qDmnyEMtJkE9Wrpau",
    "title": "Simulacra Levels and their Interactions",
    "category": "rationality",
    "curatedOrder": 51
  },
  {
    "id": "KkwtLtroaNToWs2H6",
    "title": "Most Prisoner's Dilemmas are Stag Hunts; Most Stag Hunts are Schelling Problems",
    "category": "rationality",
    "curatedOrder": 39
  },
  {
    "id": "byewoxJiAfwE6zpep",
    "title": "Reality-Revealing and Reality-Masking Puzzles",
    "category": "rationality",
    "curatedOrder": 33
  },
  {
    "id": "YcdArE79SDxwWAuyF",
    "title": "The Treacherous Path to Rationality",
    "category": "rationality",
    "curatedOrder": 36
  },
  {
    "id": "eccTPEonRe4BAvNpD",
    "title": "The Felt Sense: What, Why and How",
    "category": "rationality",
    "curatedOrder": 26
  },
  {
    "id": "sTwW3QLptTQKuyRXx",
    "title": "The First Sample Gives the Most Information",
    "category": "rationality",
    "curatedOrder": 21
  },
  {
    "id": "JD7fwtRQ27yc8NoqS",
    "title": "Strong Evidence is Common",
    "category": "rationality",
    "curatedOrder": 3
  },
  {
    "id": "gNodQGNoPDjztasbh",
    "title": "Lies, Damn Lies, and Fabricated Options",
    "category": "rationality",
    "curatedOrder": 6
  },
  {
    "id": "BcYfsi7vmhDvzQGiF",
    "title": "Taboo \"Outside View",
    "category": "rationality",
    "curatedOrder": 31
  },
  {
    "id": "hNqte2p48nqKux3wS",
    "title": "Trapped Priors As A Basic Problem Of Rationality",
    "category": "rationality",
    "curatedOrder": 17
  },
  {
    "id": "vQKbgEKjGZcpbCqDs",
    "title": "Cup-Stacking Skills (or, Reflexive Involuntary Mental Motions)",
    "category": "rationality",
    "curatedOrder": 27
  },
  {
    "id": "cujpciCqNbawBihhQ",
    "title": "Self-Integrity and the Drowning Child",
    "category": "rationality",
    "curatedOrder": 35
  },
  {
    "id": "tF8z9HBoBn783Cirz",
    "title": "Simulacrum 3 As Stag-Hunt Strategy",
    "category": "rationality",
    "curatedOrder": 47
  },
  {
    "id": "9cbEPEuCa9E7uHMXT",
    "title": "Catching the Spark",
    "category": "rationality",
    "curatedOrder": 48
  },
  {
    "id": "X79Rc5cA5mSWBexnd",
    "title": "Shoulder Advisors 101",
    "category": "rationality",
    "curatedOrder": 22
  },
  {
    "id": "9kNxhKWvixtKW5anS",
    "title": "You Are Not Measuring What You Think You Are Measuring",
    "category": "rationality",
    "curatedOrder": 13
  },
  {
    "id": "k9dsbn8LZ6tTesDS3",
    "title": "Sazen",
    "category": "rationality",
    "curatedOrder": 32
  },
  {
    "id": "jbE85wCkRr9z7tqmD",
    "title": "Epistemic Legibility",
    "category": "rationality",
    "curatedOrder": 30
  },
  {
    "id": "o3RLHYviTE4zMb9T9",
    "title": "Tyranny of the Epistemic Majority",
    "category": "rationality",
    "curatedOrder": 37
  },
  {
    "id": "bhLxWTkRc8GXunFcB",
    "title": "What Are You Tracking In Your Head?",
    "category": "rationality",
    "curatedOrder": 20
  },
  {
    "id": "vJ7ggyjuP4u2yHNcP",
    "title": "Threat-Resistant Bargaining Megapost: Introducing the ROSE Value",
    "category": "rationality",
    "curatedOrder": 45
  },
  {
    "id": "B9kP6x5rpmuCzpfWb",
    "title": "Comment reply: my low-quality thoughts on why CFAR didn't get farther with a \"real/efficacious art of rationality",
    "category": "rationality",
    "curatedOrder": 54
  },
  {
    "id": "xJyY5QkQvNJpZLJRo",
    "title": "Radical Probabilism",
    "category": "rationality",
    "curatedOrder": 52
  },
  {
    "id": "TMFNQoRZxM4CuRCY6",
    "title": "Reason isn't magic",
    "category": "rationality",
    "curatedOrder": 42
  },
  {
    "id": "8xLtE3BwgegJ7WBbf",
    "title": "Is Rationalist Self-Improvement Real",
    "category": "rationality",
    "curatedOrder": 49
  },
  {
    "id": "rYJKvagRYeDM8E9Rf",
    "title": "Prune",
    "category": "rationality",
    "curatedOrder": 10
  },
  {
    "id": "wQACBmK5bioNCgDoG",
    "title": "More Babble",
    "category": "rationality",
    "curatedOrder": 38
  },
  {
    "id": "gvK5QWRLk3H8iqcNy",
    "title": "Gears vs Behavior",
    "category": "rationality",
    "curatedOrder": 11
  }
]

registerMigration({
  name: "setReviewWinnerCategories",
  dateWritten: "2024-02-09",
  idempotent: true,
  action: async () => {
    const adminContext = createAdminContext();

    for (let { id, category, curatedOrder } of reviewWinnerCategories) {
      const dbReviewWinner = await ReviewWinners.findOne({ postId: id })
      if (!dbReviewWinner) throw new Error(`ReviewWinner with postId ${id} not found`);
      await updateMutator({
        collection: ReviewWinners,
        documentId: dbReviewWinner._id,
        set: {
          category,
          curatedOrder
        },
        context: adminContext,
        currentUser: adminContext.currentUser
      });
    }
  }
});
