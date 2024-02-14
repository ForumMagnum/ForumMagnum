import { writeFileSync } from "fs";
import { Posts } from "../../lib/collections/posts";
import ReviewWinners from "../../lib/collections/reviewWinners/collection";
import { Globals, updateMutator } from "../vulcan-lib";
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
    "id": "p7x32SEt43ZMC9r7r",
    "title": "Embedded Agents",
    "category": "ai",
    "curatedOrder": 14
  },
  {
    "id": "CvKnhXTu9BPcdKE4W",
    "title": "An Untrollable Mathematician Illustrated",
    "category": "ai",
    "curatedOrder": 8
  },
  {
    "id": "SwcyMEgLyd4C3Dern",
    "title": "The Parable of Predict-O-Matic",
    "category": "ai",
    "curatedOrder": 4
  },
  {
    "id": "ZDZmopKquzHYPRNxq",
    "title": "Selection vs Control",
    "category": "ai",
    "curatedOrder": 2
  },
  {
    "id": "Gg9a4y8reWKtLe3Tn",
    "title": "The Rocket Alignment Problem",
    "category": "ai",
    "curatedOrder": 17
  },
  {
    "id": "RQpNHSiWaXTvDxt6R",
    "title": "Coherent decisions imply consistent utilities",
    "category": "ai",
    "curatedOrder": 34
  },
  {
    "id": "FkgsxrGf3QxhfLWHG",
    "title": "Risks from Learned Optimization: Introduction",
    "category": "ai",
    "curatedOrder": 43
  },
  {
    "id": "X2i9dQQK3gETCyqh2",
    "title": "Chris Olah’s views on AGI safety",
    "category": "ai",
    "curatedOrder": 57
  },
  {
    "id": "FRv7ryoqtvSuqBxuT",
    "title": "Understanding “Deep Double Descent”",
    "category": "ai",
    "curatedOrder": 59
  },
  {
    "id": "uXH4r6MmKPedk8rMA",
    "title": "Gradient hacking",
    "category": "ai",
    "curatedOrder": 50
  },
  {
    "id": "AfGmsjGPXN97kNp57",
    "title": "Arguments about fast takeoff",
    "category": "ai",
    "curatedOrder": 37
  },
  {
    "id": "nyCHnY7T5PHPLjxmN",
    "title": "Open question: are minimal circuits daemon-free?",
    "category": "ai",
    "curatedOrder": 47
  },
  {
    "id": "HBxe6wdjxK239zajf",
    "title": "What failure looks like",
    "category": "ai",
    "curatedOrder": 12
  },
  {
    "id": "nRAMpjnb6Z4Qv3imF",
    "title": "The strategy-stealing assumption",
    "category": "ai",
    "curatedOrder": 5
  },
  {
    "id": "NxF5G6CJiof6cemTw",
    "title": "Coherence arguments do not entail goal-directed behavior",
    "category": "ai",
    "curatedOrder": 9
  },
  {
    "id": "x3fNwSe5aWZb5yXEG",
    "title": "Reframing Superintelligence: Comprehensive AI Services as General Intelligence",
    "category": "ai",
    "curatedOrder": 22
  },
  {
    "id": "bBdfbWfWxHN9Chjcq",
    "title": "Robustness to Scale",
    "category": "ai",
    "curatedOrder": 25
  },
  {
    "id": "6DuJxY8X45Sco4bS2",
    "title": "Seeking Power is Often Convergently Instrumental in MDPs",
    "category": "ai",
    "curatedOrder": 36
  },
  {
    "id": "xCxeBSHqMEaP3jDvY",
    "title": "Reframing Impact",
    "category": "ai",
    "curatedOrder": 16
  },
  {
    "id": "AanbbjYr5zckMKde7",
    "title": "Specification gaming examples in AI",
    "category": "ai",
    "curatedOrder": 1
  },
  {
    "id": "bnY3L48TtDrKTzGRb",
    "title": "AI Safety \"Success Stories",
    "category": "ai",
    "curatedOrder": 7
  },
  {
    "id": "Djs38EWYZG8o7JMWY",
    "title": "Paul's research agenda FAQ",
    "category": "ai",
    "curatedOrder": 38
  },
  {
    "id": "fRsjBseRuvRhMPPE5",
    "title": "An overview of 11 proposals for building safe advanced AI",
    "category": "ai",
    "curatedOrder": 41
  },
  {
    "id": "Nwgdq6kHke5LY692J",
    "title": "Alignment By Default",
    "category": "ai",
    "curatedOrder": 21
  },
  {
    "id": "Tr7tAyt5zZpdTwTQK",
    "title": "The Solomonoff Prior is Malign",
    "category": "ai",
    "curatedOrder": 13
  },
  {
    "id": "znfkdCoHMANwqc2WE",
    "title": "The ground of optimization",
    "category": "ai",
    "curatedOrder": 3
  },
  {
    "id": "8xRSjC76HasLnMGSf",
    "title": "AGI safety from first principles: Introduction",
    "category": "ai",
    "curatedOrder": 6
  },
  {
    "id": "gQY6LrTWJNkTv8YJR",
    "title": "The Pointers Problem: Human Values Are A Function Of Humans' Latent Variables",
    "category": "ai",
    "curatedOrder": 11
  },
  {
    "id": "ZyWyAJbedvEgRT2uF",
    "title": "Inaccessible information",
    "category": "ai",
    "curatedOrder": 30
  },
  {
    "id": "AHhCrJ2KpTjsCSwbt",
    "title": "Inner Alignment: Explain like I'm 12 Edition",
    "category": "ai",
    "curatedOrder": 27
  },
  {
    "id": "A8iGaZ3uHNNGgJeaD",
    "title": "An Orthodox Case Against Utility Functions",
    "category": "ai",
    "curatedOrder": 33
  },
  {
    "id": "zB4f7QqKhBHa5b37a",
    "title": "Introduction To The Infra-Bayesianism Sequence",
    "category": "ai",
    "curatedOrder": 48
  },
  {
    "id": "hvGoYXi2kgnS3vxqb",
    "title": "Some AI research areas and their relevance to existential safety",
    "category": "ai",
    "curatedOrder": 20
  },
  {
    "id": "r3NHPD3dLFNk9QE2Y",
    "title": "Search versus design",
    "category": "ai",
    "curatedOrder": 18
  },
  {
    "id": "qHCDysDnvhteW7kRd",
    "title": "ARC's first technical report: Eliciting Latent Knowledge",
    "category": "ai",
    "curatedOrder": 28
  },
  {
    "id": "7im8at9PmhbT4JHsW",
    "title": "Ngo and Yudkowsky on alignment difficulty",
    "category": "ai",
    "curatedOrder": 10
  },
  {
    "id": "N5Jm6Nj4HkNKySA5Z",
    "title": "Finite Factored Sets",
    "category": "ai",
    "curatedOrder": 23
  },
  {
    "id": "G2Lne2Fi7Qra5Lbuf",
    "title": "Selection Theorems: A Program For Understanding Agents",
    "category": "ai",
    "curatedOrder": 19
  },
  {
    "id": "EF5M6CmKRd6qZk27Z",
    "title": "My research methodology",
    "category": "ai",
    "curatedOrder": 15
  },
  {
    "id": "mRwJce3npmzbKfxws",
    "title": "EfficientZero: How It Works",
    "category": "ai",
    "curatedOrder": 53
  },
  {
    "id": "uMQ3cqWDPHhjtiesc",
    "title": "AGI Ruin: A List of Lethalities",
    "category": "ai",
    "curatedOrder": 40
  },
  {
    "id": "CoZhXrhpQxpy9xw9y",
    "title": "Where I agree and disagree with Eliezer",
    "category": "ai",
    "curatedOrder": 32
  },
  {
    "id": "pdaGN6pQyQarFHXF4",
    "title": "Reward is not the optimization target",
    "category": "ai",
    "curatedOrder": 44
  },
  {
    "id": "gHefoxiznGfsbiAu9",
    "title": "Inner and outer alignment decompose one hard problem into two extremely hard problems",
    "category": "ai",
    "curatedOrder": 61
  },
  {
    "id": "3pinFH3jerMzAvmza",
    "title": "On how various plans miss the hard bits of the alignment challenge",
    "category": "ai",
    "curatedOrder": 51
  },
  {
    "id": "vJFdjigzmcXMhNTsx",
    "title": "Simulators",
    "category": "ai",
    "curatedOrder": 52
  },
  {
    "id": "LDRQ5Zfqwi8GjzPYG",
    "title": "Counterarguments to the basic AI x-risk case",
    "category": "ai",
    "curatedOrder": 35
  },
  {
    "id": "kpPnReyBC54KESiSn",
    "title": "Optimality is the tiger, and agents are its teeth",
    "category": "ai",
    "curatedOrder": 26
  },
  {
    "id": "6Fpvch8RR29qLEWNH",
    "title": "chinchilla's wild implications",
    "category": "ai",
    "curatedOrder": 42
  },
  {
    "id": "rP66bz34crvDudzcJ",
    "title": "Decision theory does not imply that we get to have nice things",
    "category": "ai",
    "curatedOrder": 49
  },
  {
    "id": "N6WM6hs7RQMKDhYjB",
    "title": "A Mechanistic Interpretability Analysis of Grokking",
    "category": "ai",
    "curatedOrder": 56
  },
  {
    "id": "JvZhhzycHu2Yd57RN",
    "title": "Causal Scrubbing: a method for rigorously testing interpretability hypotheses [Redwood Research]",
    "category": "ai",
    "curatedOrder": 54
  },
  {
    "id": "TWorNr22hhYegE4RT",
    "title": "Models Don't \"Get Reward",
    "category": "ai",
    "curatedOrder": 39
  },
  {
    "id": "w4aeAFzSAguvqA5qu",
    "title": "How To Go From Interpretability To Alignment: Just Retarget The Search",
    "category": "ai",
    "curatedOrder": 29
  },
  {
    "id": "FWvzwCDRgcjb9sigb",
    "title": "Why Agent Foundations? An Overly Abstract Explanation",
    "category": "ai",
    "curatedOrder": 24
  },
  {
    "id": "GNhMPAWcfBCASy8e6",
    "title": "A central AI alignment problem: capabilities generalization, and the sharp left turn",
    "category": "ai",
    "curatedOrder": 31
  },
  {
    "id": "CjFZeDD6iCnNubDoS",
    "title": "Humans provide an untapped wealth of evidence about alignment",
    "category": "ai",
    "curatedOrder": 55
  },
  {
    "id": "iCfdcxiyr2Kj8m8mT",
    "title": "The shard theory of human values",
    "category": "ai",
    "curatedOrder": 60
  },
  {
    "id": "L4anhrxjv8j2yRKKp",
    "title": "How \"Discovering Latent Knowledge in Language Models Without Supervision\" Fits Into a Broader Alignment Scheme",
    "category": "ai",
    "curatedOrder": 58
  },
  {
    "id": "vKErZy7TFhjxtyBuG",
    "title": "Make more land",
    "category": "misc",
    "curatedOrder": 2
  },
  {
    "id": "ygFc4caQ6Nws62dSW",
    "title": "Bioinfohazards",
    "category": "misc",
    "curatedOrder": 18
  },
  {
    "id": "rBkZvbGDQZhEymReM",
    "title": "Forum participation as a research strategy",
    "category": "misc",
    "curatedOrder": 19
  },
  {
    "id": "5okDRahtDewnWfFmz",
    "title": "Seeing the Smoke",
    "category": "misc",
    "curatedOrder": 9
  },
  {
    "id": "Z9cbwuevS9cqaR96h",
    "title": "CFAR Participant Handbook now available to all",
    "category": "misc",
    "curatedOrder": 16
  },
  {
    "id": "q3JY4iRzjq56FyjGF",
    "title": "Why haven't we celebrated any major achievements lately?",
    "category": "misc",
    "curatedOrder": 14
  },
  {
    "id": "qc7P2NwfxQMC3hdgm",
    "title": "Rationalism before the Sequences",
    "category": "misc",
    "curatedOrder": 3
  },
  {
    "id": "niQ3heWwF6SydhS7R",
    "title": "Making Vaccine",
    "category": "misc",
    "curatedOrder": 11
  },
  {
    "id": "DtcbfwSrcewFubjxp",
    "title": "The Rationalists of the 1950s (and before) also called themselves “Rationalists”",
    "category": "misc",
    "curatedOrder": 15
  },
  {
    "id": "dYspinGtiba5oDCcv",
    "title": "Feature Selection",
    "category": "misc",
    "curatedOrder": 4
  },
  {
    "id": "vLRxmYCKpmZAAJ3KC",
    "title": "Elephant seal 2",
    "category": "misc",
    "curatedOrder": 6
  },
  {
    "id": "xhD6SHAAE9ghKZ9HS",
    "title": "Safetywashing",
    "category": "misc",
    "curatedOrder": 5
  },
  {
    "id": "nSjavaKcBrtNktzGa",
    "title": "Nonprofit Boards are Weird",
    "category": "misc",
    "curatedOrder": 10
  },
  {
    "id": "SA9hDewwsYgnuscae",
    "title": "ProjectLawful.com: Eliezer's latest story, past 1M words",
    "category": "misc",
    "curatedOrder": 17
  },
  {
    "id": "N9oKuQKuf7yvCCtfq",
    "title": "Can crimes be discussed literally?",
    "category": "misc",
    "curatedOrder": 8
  },
  {
    "id": "o4cgvYmNZnfS4xhxL",
    "title": "Working With Monsters",
    "category": "misc",
    "curatedOrder": 7
  },
  {
    "id": "CKgPFHoWFkviYz7CB",
    "title": "The Redaction Machine",
    "category": "misc",
    "curatedOrder": 1
  },
  {
    "id": "Ajcq9xWi2fmgn8RBJ",
    "title": "The Credit Assignment Problem",
    "category": "misc",
    "curatedOrder": 12
  },
  {
    "id": "kKSFsbjdX3kxsYaTM",
    "title": "Simple Rules of Law",
    "category": "misc",
    "curatedOrder": 13
  },
  {
    "id": "XYYyzgyuRH5rFN64K",
    "title": "What makes people intellectually active?",
    "category": "modeling",
    "curatedOrder": 42
  },
  {
    "id": "YicoiQurNBxSp7a65",
    "title": "Is Clickbait Destroying Our General Intelligence?",
    "category": "modeling",
    "curatedOrder": 27
  },
  {
    "id": "NQgWL7tvAPgN2LTLn",
    "title": "Spaghetti Towers",
    "category": "modeling",
    "curatedOrder": 22
  },
  {
    "id": "PrCmeuBPC4XLDQz8C",
    "title": "Unconscious Economics",
    "category": "modeling",
    "curatedOrder": 46
  },
  {
    "id": "mELQFMi9egPn5EAjK",
    "title": "My attempt to explain Looking, insight meditation, and enlightenment in non-mysterious terms",
    "category": "modeling",
    "curatedOrder": 23
  },
  {
    "id": "i9xyZBS3qzA8nFXNQ",
    "title": "Book summary: Unlocking the Emotional Brain",
    "category": "modeling",
    "curatedOrder": 31
  },
  {
    "id": "X5RyaEDHNq5qutSHK",
    "title": "Anti-social Punishment",
    "category": "modeling",
    "curatedOrder": 5
  },
  {
    "id": "BhXA6pvAbsFz3gvn4",
    "title": "Research: Rescuers during the Holocaust",
    "category": "modeling",
    "curatedOrder": 2
  },
  {
    "id": "ZFtesgbY9XwtqqyZ5",
    "title": "human psycholinguists: a critical appraisal",
    "category": "modeling",
    "curatedOrder": 43
  },
  {
    "id": "nnNdz7XQrd5bWTgoP",
    "title": "On the Loss and Preservation of Knowledge",
    "category": "modeling",
    "curatedOrder": 11
  },
  {
    "id": "v7c47vjta3mavY3QC",
    "title": "Is Science Slowing Down?",
    "category": "modeling",
    "curatedOrder": 12
  },
  {
    "id": "Zm7WAJMTaFvuh2Wc7",
    "title": "Book Review: The Secret Of Our Success",
    "category": "modeling",
    "curatedOrder": 15
  },
  {
    "id": "AqbWna2S85pFTsHH4",
    "title": "The Intelligent Social Web",
    "category": "modeling",
    "curatedOrder": 45
  },
  {
    "id": "KrJfoZzpSDpnrv9va",
    "title": "Draft report on AI timelines",
    "category": "modeling",
    "curatedOrder": 53
  },
  {
    "id": "YABJKJ3v97k9sbxwg",
    "title": "What Money Cannot Buy",
    "category": "modeling",
    "curatedOrder": 13
  },
  {
    "id": "P6fSj3t4oApQQTB7E",
    "title": "Coordination as a Scarce Resource",
    "category": "modeling",
    "curatedOrder": 17
  },
  {
    "id": "ivpKSjM4D6FbqF4pZ",
    "title": "Cortés, Pizarro, and Afonso as Precedents for Takeover",
    "category": "modeling",
    "curatedOrder": 48
  },
  {
    "id": "diruo47z32eprenTg",
    "title": "My computational framework for the brain",
    "category": "modeling",
    "curatedOrder": 44
  },
  {
    "id": "aFaKhG86tTrKvtAnT",
    "title": "Against GDP as a metric for timelines and takeoff speeds",
    "category": "modeling",
    "curatedOrder": 57
  },
  {
    "id": "RcifQCKkRc9XTjxC2",
    "title": "Anti-Aging: State of the Art",
    "category": "modeling",
    "curatedOrder": 33
  },
  {
    "id": "hyShz2ABiKX56j5tJ",
    "title": "Interfaces as a Scarce Resource",
    "category": "modeling",
    "curatedOrder": 3
  },
  {
    "id": "CeZXDmp8Z363XaM6b",
    "title": "Discontinuous progress in history: an update",
    "category": "modeling",
    "curatedOrder": 40
  },
  {
    "id": "WFopenhCXyHX3ukw3",
    "title": "How uniform is the neocortex?",
    "category": "modeling",
    "curatedOrder": 20
  },
  {
    "id": "sT6NxFxso6Z9xjS7o",
    "title": "Nuclear war is unlikely to cause human extinction",
    "category": "modeling",
    "curatedOrder": 49
  },
  {
    "id": "x6hpkYyzMG6Bf8T3W",
    "title": "Swiss Political System: More than You ever Wanted to Know (I.)",
    "category": "modeling",
    "curatedOrder": 29
  },
  {
    "id": "4s2gbwMHSdh2SByyZ",
    "title": "Transportation as a Constraint",
    "category": "modeling",
    "curatedOrder": 24
  },
  {
    "id": "JPan54R525D68NoEt",
    "title": "The date of AI Takeover is not the day the AI takes over",
    "category": "modeling",
    "curatedOrder": 52
  },
  {
    "id": "5FZxhdi6hZp8QwK7k",
    "title": "This Can't Go On",
    "category": "modeling",
    "curatedOrder": 50
  },
  {
    "id": "rzqACeBGycZtqCfaX",
    "title": "Fun with +12 OOMs of Compute",
    "category": "modeling",
    "curatedOrder": 35
  },
  {
    "id": "6Xgy6CAf2jqHhynHL",
    "title": "What 2026 looks like",
    "category": "modeling",
    "curatedOrder": 41
  },
  {
    "id": "4XRjPocTprL4L8tmB",
    "title": "Science in a High-Dimensional World",
    "category": "modeling",
    "curatedOrder": 6
  },
  {
    "id": "DQKgYhEYP86PLW7tZ",
    "title": "How factories were made safe",
    "category": "modeling",
    "curatedOrder": 1
  },
  {
    "id": "F5ktR95qqpmGXXmLq",
    "title": "All Possible Views About Humanity's Future Are Wild",
    "category": "modeling",
    "curatedOrder": 54
  },
  {
    "id": "fRwdkop6tyhi3d22L",
    "title": "There’s no such thing as a tree (phylogenetically)",
    "category": "modeling",
    "curatedOrder": 4
  },
  {
    "id": "pv7Qpu8WSge8NRbpB",
    "title": "larger language models may disappoint you [or, an eternally unfinished draft]",
    "category": "modeling",
    "curatedOrder": 51
  },
  {
    "id": "cCMihiwtZx7kdcKgt",
    "title": "Comments on Carlsmith's “Is power-seeking AI an existential risk?”",
    "category": "modeling",
    "curatedOrder": 55
  },
  {
    "id": "CSZnj2YNMKGfsMbZA",
    "title": "Specializing in Problems We Don't Understand",
    "category": "modeling",
    "curatedOrder": 19
  },
  {
    "id": "Cf2xxC3Yx9g6w7yXN",
    "title": "Notes from \"Don't Shoot the Dog",
    "category": "modeling",
    "curatedOrder": 10
  },
  {
    "id": "ThvvCE2HsLohJYd7b",
    "title": "Why has nuclear power been a flop?",
    "category": "modeling",
    "curatedOrder": 38
  },
  {
    "id": "a5e9arCnbDac9Doig",
    "title": "It Looks Like You're Trying To Take Over The World",
    "category": "modeling",
    "curatedOrder": 18
  },
  {
    "id": "pRkFkzwKZ2zfa3R6H",
    "title": "Without specific countermeasures, the easiest path to transformative AI likely leads to AI takeover",
    "category": "modeling",
    "curatedOrder": 47
  },
  {
    "id": "REA49tL5jsh69X3aM",
    "title": "Introduction to abstract entropy",
    "category": "modeling",
    "curatedOrder": 56
  },
  {
    "id": "htrZrxduciZ5QaCjw",
    "title": "Language models seem to be much better than humans at next-token prediction",
    "category": "modeling",
    "curatedOrder": 25
  },
  {
    "id": "J3wemDGtsy5gzD3xa",
    "title": "Toni Kurz and the Insanity of Climbing Mountains",
    "category": "modeling",
    "curatedOrder": 7
  },
  {
    "id": "sbcmACvB6DqYXYidL",
    "title": "Counter-theses on Sleep",
    "category": "modeling",
    "curatedOrder": 39
  },
  {
    "id": "xFotXGEotcKouifky",
    "title": "Worlds Where Iterative Design Fails",
    "category": "modeling",
    "curatedOrder": 16
  },
  {
    "id": "JJFphYfMsdFMuprBy",
    "title": "Mental Mountains",
    "category": "modeling",
    "curatedOrder": 34
  },
  {
    "id": "f2GF3q6fgyx8TqZcn",
    "title": "Literature Review: Distributed Teams",
    "category": "modeling",
    "curatedOrder": 36
  },
  {
    "id": "fnkbdwckdfHS2H22Q",
    "title": "Steelmanning Divination",
    "category": "modeling",
    "curatedOrder": 28
  },
  {
    "id": "5gfqG3Xcopscta3st",
    "title": "Building up to an Internal Family Systems model",
    "category": "modeling",
    "curatedOrder": 37
  },
  {
    "id": "bNXdnRTpSXk9p4zmi",
    "title": "Book Review: Design Principles of Biological Circuits",
    "category": "modeling",
    "curatedOrder": 32
  },
  {
    "id": "JBFHzfPkXHB2XfDGj",
    "title": "Evolution of Modularity",
    "category": "modeling",
    "curatedOrder": 26
  },
  {
    "id": "8SEvTvYFX2KDRZjti",
    "title": "[Answer] Why wasn't science invented in China?",
    "category": "modeling",
    "curatedOrder": 30
  },
  {
    "id": "9fB4gvoooNYa4t56S",
    "title": "Power Buys You Distance From The Crime",
    "category": "optimization",
    "curatedOrder": 1
  },
  {
    "id": "D6trAzh6DApKPhbv4",
    "title": "A voting theory primer for rationalists",
    "category": "optimization",
    "curatedOrder": 6
  },
  {
    "id": "XvN2QQpKTuEzgkZHY",
    "title": "Being the (Pareto) Best in the World",
    "category": "optimization",
    "curatedOrder": 13
  },
  {
    "id": "2G8j8D5auZKKAjSfY",
    "title": "Inadequate Equilibria vs. Governance of the Commons",
    "category": "optimization",
    "curatedOrder": 11
  },
  {
    "id": "36Dhz325MZNq3Cs6B",
    "title": "The Amish, and Strategic Norms around Technology",
    "category": "optimization",
    "curatedOrder": 20
  },
  {
    "id": "duxy4Hby5qMsv42i8",
    "title": "The Real Rules Have No Exceptions",
    "category": "optimization",
    "curatedOrder": 15
  },
  {
    "id": "3rxMBRCYEmHCNDLhu",
    "title": "The Pavlov Strategy",
    "category": "optimization",
    "curatedOrder": 10
  },
  {
    "id": "u8GMcpEN9Z6aQiCvp",
    "title": "Rule Thinkers In, Not Out",
    "category": "optimization",
    "curatedOrder": 2
  },
  {
    "id": "asmZvCPHcB4SkSCMW",
    "title": "The Tails Coming Apart As Metaphor For Life",
    "category": "optimization",
    "curatedOrder": 5
  },
  {
    "id": "Qz6w4GYZpgeDp6ATB",
    "title": "Beyond Astronomical Waste",
    "category": "optimization",
    "curatedOrder": 25
  },
  {
    "id": "a4jRN9nbD79PAhWTB",
    "title": "Prediction Markets: When Do They Work?",
    "category": "optimization",
    "curatedOrder": 16
  },
  {
    "id": "YRgMCXMbkKBZgMz4M",
    "title": "Asymmetric Justice",
    "category": "optimization",
    "curatedOrder": 24
  },
  {
    "id": "ham9i5wf4JCexXnkN",
    "title": "Moloch Hasn’t Won",
    "category": "optimization",
    "curatedOrder": 21
  },
  {
    "id": "EYd63hYSzadcNnZTD",
    "title": "Blackmail",
    "category": "optimization",
    "curatedOrder": 28
  },
  {
    "id": "wEebEiPpEwjYvnyqq",
    "title": "When Money Is Abundant, Knowledge Is The Real Wealth",
    "category": "optimization",
    "curatedOrder": 4
  },
  {
    "id": "XtRAkvvaQSaQEyASj",
    "title": "Lars Doucet's Georgism series on Astral Codex Ten",
    "category": "optimization",
    "curatedOrder": 9
  },
  {
    "id": "j9Q8bRmwCgXRYAgcJ",
    "title": "MIRI announces new \"Death With Dignity\" strategy",
    "category": "optimization",
    "curatedOrder": 12
  },
  {
    "id": "uFNgRumrDTpBfQGrs",
    "title": "Let’s think about slowing down AI",
    "category": "optimization",
    "curatedOrder": 8
  },
  {
    "id": "keiYkaeoLHoKK4LYA",
    "title": "Six Dimensions of Operational Adequacy in AGI Projects",
    "category": "optimization",
    "curatedOrder": 23
  },
  {
    "id": "kipMvuaK3NALvFHc9",
    "title": "What an actually pessimistic containment strategy looks like",
    "category": "optimization",
    "curatedOrder": 18
  },
  {
    "id": "mmHctwkKjpvaQdC3c",
    "title": "What should you change in response to an \"emergency\"? And AI risk",
    "category": "optimization",
    "curatedOrder": 19
  },
  {
    "id": "AyNHoTWWAJ5eb99ji",
    "title": "Another (outer) alignment failure story",
    "category": "optimization",
    "curatedOrder": 26
  },
  {
    "id": "LpM3EAakwYdS6aRKf",
    "title": "What Multipolar Failure Looks Like, and Robust Agent-Agnostic Processes (RAAPs)",
    "category": "optimization",
    "curatedOrder": 27
  },
  {
    "id": "3L46WGauGpr7nYubu",
    "title": "The Plan",
    "category": "optimization",
    "curatedOrder": 22
  },
  {
    "id": "Ke2ogqSEhL2KCJCNx",
    "title": "Security Mindset: Lessons from 20+ years of Software Security Failures Relevant to AGI Alignment",
    "category": "optimization",
    "curatedOrder": 14
  },
  {
    "id": "D4hHASaZuLCW92gMy",
    "title": "Is Success the Enemy of Freedom? (Full)",
    "category": "optimization",
    "curatedOrder": 7
  },
  {
    "id": "L6Ktf952cwdMJnzWm",
    "title": "Motive Ambiguity",
    "category": "optimization",
    "curatedOrder": 17
  },
  {
    "id": "GZSzMqr8hAB2dR8pk",
    "title": "Studies On Slack",
    "category": "optimization",
    "curatedOrder": 3
  },
  {
    "id": "PqMT9zGrNsGJNfiFR",
    "title": "Alignment Research Field Guide",
    "category": "practical",
    "curatedOrder": 30
  },
  {
    "id": "4EGYhyyJXSnE7xJ9H",
    "title": "In My Culture",
    "category": "practical",
    "curatedOrder": 12
  },
  {
    "id": "TPjbTXntR54XSZ3F2",
    "title": "Paper-Reading for Gears",
    "category": "practical",
    "curatedOrder": 13
  },
  {
    "id": "B2CfMNfay2P8f2yyc",
    "title": "The Loudest Alarm Is Probably False",
    "category": "practical",
    "curatedOrder": 6
  },
  {
    "id": "E4zGWYzh6ZiG85b2z",
    "title": "The Curse Of The Counterfactual",
    "category": "practical",
    "curatedOrder": 22
  },
  {
    "id": "4ZvJab25tDebB8FGE",
    "title": "You Get About Five Words",
    "category": "practical",
    "curatedOrder": 15
  },
  {
    "id": "cM8GNMpzfKCkPnd5v",
    "title": "Do you fear the rock or the hard place?",
    "category": "practical",
    "curatedOrder": 17
  },
  {
    "id": "ximou2kyQorm6MPjX",
    "title": "Rest Days vs Recovery Days",
    "category": "practical",
    "curatedOrder": 1
  },
  {
    "id": "KwdcMts8P8hacqwrX",
    "title": "Noticing the Taste of Lotus",
    "category": "practical",
    "curatedOrder": 11
  },
  {
    "id": "krarE7WFijAtHf3hm",
    "title": "microCOVID.org: A tool to estimate COVID risk from common activities",
    "category": "practical",
    "curatedOrder": 4
  },
  {
    "id": "rz73eva3jv267Hy7B",
    "title": "Can you keep this confidential? How do you know?",
    "category": "practical",
    "curatedOrder": 20
  },
  {
    "id": "4K5pJnKBGkqqTbyxx",
    "title": "To listen well, get curious",
    "category": "practical",
    "curatedOrder": 18
  },
  {
    "id": "MzKKi7niyEqkBPnyu",
    "title": "Your Cheerful Price",
    "category": "practical",
    "curatedOrder": 10
  },
  {
    "id": "2cYebKxNp47PapHTL",
    "title": "Cryonics signup guide #1: Overview",
    "category": "practical",
    "curatedOrder": 19
  },
  {
    "id": "tTWL6rkfEuQN9ivxj",
    "title": "Leaky Delegation: You are not a Commodity",
    "category": "practical",
    "curatedOrder": 16
  },
  {
    "id": "vzfz4AS6wbooaTeQk",
    "title": "Staring into the abyss as a core life skill",
    "category": "practical",
    "curatedOrder": 8
  },
  {
    "id": "fFY2HeC9i2Tx8FEnK",
    "title": "Luck based medicine: my resentful story of becoming a medical miracle",
    "category": "practical",
    "curatedOrder": 14
  },
  {
    "id": "ma7FSEtumkve8czGF",
    "title": "Losing the root for the tree",
    "category": "practical",
    "curatedOrder": 3
  },
  {
    "id": "R6M4vmShiowDn56of",
    "title": "Butterfly Ideas",
    "category": "practical",
    "curatedOrder": 7
  },
  {
    "id": "2MiDpjWraeL5bypRE",
    "title": "Useful Vices for Wicked Problems",
    "category": "practical",
    "curatedOrder": 5
  },
  {
    "id": "ii4xtogen7AyYmN6B",
    "title": "Learning By Writing",
    "category": "practical",
    "curatedOrder": 9
  },
  {
    "id": "nTGEeRSZrfPiJwkEc",
    "title": "The Onion Test for Personal and Institutional Honesty",
    "category": "practical",
    "curatedOrder": 21
  },
  {
    "id": "Psr9tnQFuEXiuqGcR",
    "title": "How To Write Quickly While Maintaining Epistemic Rigor",
    "category": "practical",
    "curatedOrder": 23
  },
  {
    "id": "t2LGSDwT7zSnAGybG",
    "title": "Split and Commit",
    "category": "practical",
    "curatedOrder": 29
  },
  {
    "id": "bx3gkHJehRCYZAF3r",
    "title": "Pain is not the unit of Effort",
    "category": "practical",
    "curatedOrder": 27
  },
  {
    "id": "SWxnP5LZeJzuT3ccd",
    "title": "“PR” is corrosive; “reputation” is not.",
    "category": "practical",
    "curatedOrder": 28
  },
  {
    "id": "3qX2GipDuCq5jstMG",
    "title": "Slack Has Positive Externalities For Groups",
    "category": "practical",
    "curatedOrder": 24
  },
  {
    "id": "57sq9qA3wurjres4K",
    "title": "Ruling Out Everything Else",
    "category": "practical",
    "curatedOrder": 25
  },
  {
    "id": "Jk9yMXpBLMWNTFLzh",
    "title": "Limerence Messes Up Your Rationality Real Bad, Yo",
    "category": "practical",
    "curatedOrder": 26
  },
  {
    "id": "zTfSXQracE7TW8x4w",
    "title": "Mistakes with Conservation of Expected Evidence",
    "category": "rationality",
    "curatedOrder": 19
  },
  {
    "id": "i42Dfoh4HtsCAfXxL",
    "title": "Babble",
    "category": "rationality",
    "curatedOrder": 10
  },
  {
    "id": "9QxnfMYccz9QRgZ5z",
    "title": "The Costly Coordination Mechanism of Common Knowledge",
    "category": "rationality",
    "curatedOrder": 26
  },
  {
    "id": "yeADMcScw8EW9yxpH",
    "title": "A Sketch of Good Communication",
    "category": "rationality",
    "curatedOrder": 34
  },
  {
    "id": "8XDZjfThxDxLvKWiM",
    "title": "Excerpts from a larger discussion about simulacra",
    "category": "rationality",
    "curatedOrder": 39
  },
  {
    "id": "4QemtxDFaGXyGSrGD",
    "title": "Other people are wrong\" vs \"I am right",
    "category": "rationality",
    "curatedOrder": 16
  },
  {
    "id": "WQFioaudEH8R7fyhm",
    "title": "Local Validity as a Key to Sanity and Civilization",
    "category": "rationality",
    "curatedOrder": 9
  },
  {
    "id": "CPP2uLcaywEokFKQG",
    "title": "Toolbox-thinking and Law-thinking",
    "category": "rationality",
    "curatedOrder": 3
  },
  {
    "id": "xdwbX9pFEr7Pomaxv",
    "title": "Meta-Honesty: Firming Up Honesty Around Its Edge-Cases",
    "category": "rationality",
    "curatedOrder": 28
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
    "curatedOrder": 36
  },
  {
    "id": "nEBbw2Bc2CnN2RMxy",
    "title": "Gears-Level Models are Capital Investments",
    "category": "rationality",
    "curatedOrder": 20
  },
  {
    "id": "2jfiMgKkh7qw9z8Do",
    "title": "Being a Robust Agent",
    "category": "rationality",
    "curatedOrder": 44
  },
  {
    "id": "zp5AEENssb8ZDnoZR",
    "title": "The Schelling Choice is \"Rabbit\", not \"Stag",
    "category": "rationality",
    "curatedOrder": 42
  },
  {
    "id": "f886riNJcArmpFahm",
    "title": "Noticing Frame Differences",
    "category": "rationality",
    "curatedOrder": 38
  },
  {
    "id": "YN6daWakNnkXEeznB",
    "title": "Propagating Facts into Aesthetics",
    "category": "rationality",
    "curatedOrder": 40
  },
  {
    "id": "4ZwGqkMTyAvANYEDw",
    "title": "Naming the Nameless",
    "category": "rationality",
    "curatedOrder": 47
  },
  {
    "id": "NLBbCQeNLFvBJJkrt",
    "title": "Varieties Of Argumentative Experience",
    "category": "rationality",
    "curatedOrder": 5
  },
  {
    "id": "G5TwJ9BGxcgh5DsmQ",
    "title": "Yes Requires the Possibility of No",
    "category": "rationality",
    "curatedOrder": 4
  },
  {
    "id": "DoPo4PDjgSySquHX8",
    "title": "Heads I Win, Tails?—Never Heard of Her; Or, Selective Reporting and the Tragedy of the Green Rationalists",
    "category": "rationality",
    "curatedOrder": 12
  },
  {
    "id": "qDmnyEMtJkE9Wrpau",
    "title": "Simulacra Levels and their Interactions",
    "category": "rationality",
    "curatedOrder": 15
  },
  {
    "id": "KkwtLtroaNToWs2H6",
    "title": "Most Prisoner's Dilemmas are Stag Hunts; Most Stag Hunts are Schelling Problems",
    "category": "rationality",
    "curatedOrder": 23
  },
  {
    "id": "byewoxJiAfwE6zpep",
    "title": "Reality-Revealing and Reality-Masking Puzzles",
    "category": "rationality",
    "curatedOrder": 37
  },
  {
    "id": "YcdArE79SDxwWAuyF",
    "title": "The Treacherous Path to Rationality",
    "category": "rationality",
    "curatedOrder": 27
  },
  {
    "id": "eccTPEonRe4BAvNpD",
    "title": "The Felt Sense: What, Why and How",
    "category": "rationality",
    "curatedOrder": 33
  },
  {
    "id": "sTwW3QLptTQKuyRXx",
    "title": "The First Sample Gives the Most Information",
    "category": "rationality",
    "curatedOrder": 22
  },
  {
    "id": "JD7fwtRQ27yc8NoqS",
    "title": "Strong Evidence is Common",
    "category": "rationality",
    "curatedOrder": 2
  },
  {
    "id": "gNodQGNoPDjztasbh",
    "title": "Lies, Damn Lies, and Fabricated Options",
    "category": "rationality",
    "curatedOrder": 35
  },
  {
    "id": "BcYfsi7vmhDvzQGiF",
    "title": "Taboo \"Outside View",
    "category": "rationality",
    "curatedOrder": 30
  },
  {
    "id": "hNqte2p48nqKux3wS",
    "title": "Trapped Priors As A Basic Problem Of Rationality",
    "category": "rationality",
    "curatedOrder": 6
  },
  {
    "id": "vQKbgEKjGZcpbCqDs",
    "title": "Cup-Stacking Skills (or, Reflexive Involuntary Mental Motions)",
    "category": "rationality",
    "curatedOrder": 8
  },
  {
    "id": "cujpciCqNbawBihhQ",
    "title": "Self-Integrity and the Drowning Child",
    "category": "rationality",
    "curatedOrder": 1
  },
  {
    "id": "tF8z9HBoBn783Cirz",
    "title": "Simulacrum 3 As Stag-Hunt Strategy",
    "category": "rationality",
    "curatedOrder": 14
  },
  {
    "id": "9cbEPEuCa9E7uHMXT",
    "title": "Catching the Spark",
    "category": "rationality",
    "curatedOrder": 13
  },
  {
    "id": "X79Rc5cA5mSWBexnd",
    "title": "Shoulder Advisors 101",
    "category": "rationality",
    "curatedOrder": 29
  },
  {
    "id": "9kNxhKWvixtKW5anS",
    "title": "You Are Not Measuring What You Think You Are Measuring",
    "category": "rationality",
    "curatedOrder": 41
  },
  {
    "id": "k9dsbn8LZ6tTesDS3",
    "title": "Sazen",
    "category": "rationality",
    "curatedOrder": 46
  },
  {
    "id": "jbE85wCkRr9z7tqmD",
    "title": "Epistemic Legibility",
    "category": "rationality",
    "curatedOrder": 31
  },
  {
    "id": "o3RLHYviTE4zMb9T9",
    "title": "Tyranny of the Epistemic Majority",
    "category": "rationality",
    "curatedOrder": 32
  },
  {
    "id": "bhLxWTkRc8GXunFcB",
    "title": "What Are You Tracking In Your Head?",
    "category": "rationality",
    "curatedOrder": 7
  },
  {
    "id": "vJ7ggyjuP4u2yHNcP",
    "title": "Threat-Resistant Bargaining Megapost: Introducing the ROSE Value",
    "category": "rationality",
    "curatedOrder": 49
  },
  {
    "id": "B9kP6x5rpmuCzpfWb",
    "title": "Comment reply: my low-quality thoughts on why CFAR didn't get farther with a \"real/efficacious art of rationality",
    "category": "rationality",
    "curatedOrder": 48
  },
  {
    "id": "xJyY5QkQvNJpZLJRo",
    "title": "Radical Probabilism",
    "category": "rationality",
    "curatedOrder": 45
  },
  {
    "id": "TMFNQoRZxM4CuRCY6",
    "title": "Reason isn't magic",
    "category": "rationality",
    "curatedOrder": 24
  },
  {
    "id": "8xLtE3BwgegJ7WBbf",
    "title": "Is Rationalist Self-Improvement Real",
    "category": "rationality",
    "curatedOrder": 17
  },
  {
    "id": "rYJKvagRYeDM8E9Rf",
    "title": "Prune",
    "category": "rationality",
    "curatedOrder": 11
  },
  {
    "id": "wQACBmK5bioNCgDoG",
    "title": "More Babble",
    "category": "rationality",
    "curatedOrder": 25
  },
  {
    "id": "mFqG58s4NE3EE68Lq",
    "title": "Why did everything take so long?",
    "category": "modeling",
    "curatedOrder": 14
  },
  {
    "id": "S7csET9CgBtpi7sCh",
    "title": "Challenges to Christiano's capability amplification proposal",
    "category": "ai",
    "curatedOrder": 62
  },
  {
    "id": "tj8QP2EFdP8p54z6i",
    "title": "Historical mathematicians exhibit a birth order effect too",
    "category": "modeling",
    "curatedOrder": 8
  },
  {
    "id": "QTLTic5nZ2DaBtoCv",
    "title": "Birth order effect found in Nobel Laureates in Physics",
    "category": "modeling",
    "curatedOrder": 21
  },
  {
    "id": "gvK5QWRLk3H8iqcNy",
    "title": "Gears vs Behavior",
    "category": "rationality",
    "curatedOrder": 21
  },
  {
    "id": "ax695frGJEzGxFBK4",
    "title": "Biology-Inspired AGI Timelines: The Trick That Never Works",
    "category": "ai",
    "curatedOrder": 45
  },
  {
    "id": "nNqXfnjiezYukiMJi",
    "title": "Reply to Eliezer on Biological Anchors",
    "category": "ai",
    "curatedOrder": 46
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
