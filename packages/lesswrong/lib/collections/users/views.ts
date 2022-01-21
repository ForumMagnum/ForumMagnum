import Users from "../users/collection";
import { ensureIndex } from '../../collectionUtils';
import { spamRiskScoreThreshold } from "../../../components/common/RecaptchaWarning";
import pick from 'lodash/pick';
import isNumber from 'lodash/isNumber';
import mapValues from 'lodash/mapValues';

declare global {
  interface UsersViewTerms extends ViewTermsBase {
    view?: UsersViewName
    sort?: {
      createdAt?: number,
      karma?: number,
      postCount?: number,
      commentCount?: number,
      afKarma?: number,
      afPostCount?: number,
      afCommentCount?: number,
    },
    userId?: string,
    slug?: string,
  }
}

// Auto-generated indexes from production
ensureIndex(Users, {username:1}, {unique:true,sparse:1});
ensureIndex(Users, {"emails.address":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.resume.loginTokens.hashedToken":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.resume.loginTokens.token":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.resume.haveLoginTokensToDelete":1}, {sparse:1});
ensureIndex(Users, {"services.resume.loginTokens.when":1}, {sparse:1});
ensureIndex(Users, {"services.email.verificationTokens.token":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.password.reset.token":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.password.reset.when":1}, {sparse:1});
ensureIndex(Users, {"services.twitter.id":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.facebook.id":1}, {unique:true,sparse:1});
ensureIndex(Users, {"services.google.id":1}, {unique:true,sparse:1});
ensureIndex(Users, {karma:-1,_id:-1});
ensureIndex(Users, {slug:1});
ensureIndex(Users, {isAdmin:1});
ensureIndex(Users, {"services.github.id":1}, {unique:true,sparse:1});
ensureIndex(Users, {createdAt:-1,_id:-1});

// Case-insensitive email index
ensureIndex(Users, {'emails.address': 1}, {sparse: 1, unique: true, collation: { locale: 'en', strength: 2 }})

ensureIndex(Users, {email: 1})

const termsToMongoSort = (terms: UsersViewTerms) => {
  if (!terms.sort)
    return undefined;
  
  const filteredSort = pick(terms.sort, [
    "createdAt", "karma", "postCount", "commentCount",
    "afKarma", "afPostCount", "afCommentCount",
  ]);
  return mapValues(filteredSort,
    v => isNumber(v) ? v : 1
  );
}

Users.addView('usersProfile', function(terms: UsersViewTerms) {
  if (terms.userId) {
    return {
      selector: {_id:terms.userId}
    }
  }

  return {
    selector: {$or: [{slug: terms.slug}, {oldSlugs: terms.slug}]},
  }
});

ensureIndex(Users, {oldSlugs:1});

Users.addView('LWSunshinesList', function(terms: UsersViewTerms) {
  return {
    selector: {groups:'sunshineRegiment'},
    options: {
      sort: termsToMongoSort(terms),
    }
  }
});

Users.addView('LWTrustLevel1List', function(terms: UsersViewTerms) {
  return {
    selector: {groups:'trustLevel1'},
    options: {
      sort: termsToMongoSort(terms),
    }
  }
});

Users.addView('LWUsersAdmin', (terms: UsersViewTerms) => ({
  options: {
    sort: termsToMongoSort(terms),
  }
}));

Users.addView("usersWithBannedUsers", function () {
  return {
    selector: {
      bannedUserIds: {$exists: true}
    },
  }
})

Users.addView("sunshineNewUsers", function (terms: UsersViewTerms) {
  return {
    selector: {
      needsReview: true,
      reviewedByUserId: null,
      $or: [{signUpReCaptchaRating: {$gt: spamRiskScoreThreshold*1.25}}, {signUpReCaptchaRating: {$exists: false}}, {signUpReCaptchaRating:null}]
    },
    options: {
      sort: {
        sunshineFlagged: -1,
        reviewedByUserId: 1,
        postCount: -1,
        signUpReCaptchaRating: -1,
        createdAt: -1
      }
    }
  }
})
ensureIndex(Users, {needsReview: 1, signUpReCaptchaRating: 1, createdAt: -1})

Users.addView("allUsers", function (terms: UsersViewTerms) {
  return {
    options: {
      sort: {
        ...termsToMongoSort(terms),
        reviewedAt: -1,
        createdAt: -1
      }
    }
  }
})
ensureIndex(Users, {reviewedAt: -1, createdAt: -1})

Users.addView("usersMapLocations", function () {
  return {
    selector: {
      mapLocationSet: true
    },
  }
})
ensureIndex(Users, {mapLocationSet: 1})

Users.addView("reviewAdminUsers", function (terms: UsersViewTerms) {
  return {
    selector: {
      karma: {$gte: 1000},
    },
    options: {
      sort: {
        karma: -1
      }
    }
  }
})

Users.addView("usersWithPaymentInfo", function (terms: UsersViewTerms) {
  return {
    selector: {
      $or: [{ paymentEmail: {$exists: true}}, {paymentInfo: {$exists: true}}],
    },
    options: {
      sort: {
        displayName: 1
      }
    }
  }
})


export const hashedPetrovLaunchCodes = [
  "KEDzA2lmOdFDFweWi6jWe9kerEYXGn4qvXjrI41S4bc=",
  "iEe7eacQU9TLDrB+bkEDW5/Ti6EkZzNfsHvE/0rlRE8=",
  "jQLUwGlfOYo2+uczUN6bBBnOuzyek18dcoYaCWmtACA=",
  "U7IzacSbqJA27Xpm8YU5MExdf0JNH20GTYd0fIKEbag=",
  "UpIrSpxnf7U2AXPhkXAFQmK3hBvVyIIFisgMdhqQ0vU=",
  "weXBk/Qe8ghzGCFhOJ07pSiLyRo/NQxq2zEWuEGx/Kk=",
  "9M7XPkLgxURmC2TJYTi9SbsZkgg3eWqYiaa8TpROuSA=",
  "H8WnoWoTP0y0IHwKxigJrGYEWNwqHu4c64LfmMsRNng=",
  "MP8tXSZYg4O4O9XzlRpTOYVm30tXcM9x6mObSMoe5Jo=",
  "I8d8mWBeVO2vhSJbg/FzNSiOL/5XbA+xhsXLnHn1jwY=",
  "hgZXRwTmS92d7wOwpaJq2rQRrsjcRhFbetytSfYYNOg=",
  "jwZCimOX03f8WIDCBqjKClCpRlB/BTMdYzyJg/Ny224=",
  "dFY3IfBBAJFypw8KtEX8yuSkm99kNfSskuTsR49zTow=",
  "mdyX6Y/qYs+wsKyZxv/7mHWS5Vvym4coh8KjBBsb+L4=",
  "SNUKPUsFtgr5y1BWxXtAkZE73pFHdFnYUJapVWVVJy8=",
  "usmj8eXdbghMD+/0Fn04Bw0MLPzTpEPqn9Pj1JTsAVk=",
  "v2kpY58U7kVyOiUscaztgOi4s9OiCVXv6S9QKq+ZHe4=",
  "63F4EbuLc8opRINm/sGqQsmy53oz+wC9AYGVddhk5qM=",
  "C9pHTHQ+w5d+a0N+nXxO2nX4WhBUsNobOfK6Fvms7Q4=",
  "wxGJxbk1WK7+RijxqFXx6DIwZzQORkZOv0JW6FaKFCQ=",
  "wB1Ns819Sx+UdB3PglJhHpZTcyrcs9HqfD2m7o3KRk8=",
  "Ad3OEzt/EQJPDKO63wYmKnOxNO6iJi2wwV3MbaxB+LE=",
  "TtER2oLUDlmX7AZjh4cKAj5axS5K0M4/w2Kq0dMI+v4=",
  "fAwMckf5AiJyklIQDSSkHMX+0NLHsugm+9kBe1rUs6A=",
  "M5gFYJuEiRVJe5ZjNyo576lycQVS13eKZTHAxto9dhk=",
  "oy8YNQE7CRur7Q/2fTEcY2SU5hNXz6zuJWC+tvo9sbY=",
  "749MNm9/pF6AMPfpWzfZipdh+nPqEEgS2jCMh4zeG4w=",
  "6BEpoFIaPOf85NExYFSHxbLiweU5JyigkrUX3tvB2w4=",
  "q7wlG1O0dWIsiHVsmDyBYZs5rkshYaGtOZHjExVk2I8=",
  "+U51njudAG0PTdO+vVD6KinYJIlh6A6orxoP6vrel9Q=",
  "kdXOpISGbI6yWG4ibJ1fwt5mD0xOPYVnqfFKA6M5MQk=",
  "ZE3tPHl70KCYVJb3FaqTYjrVQaaW4asWSKcRwICBXJ0=",
  "ZlU5XpgiujrMLY7fyFLyOaZxP+bbl0ySMeLTIVaBXsU=",
  "q6F4vL8FKbYxsZIuAlwVF2op4KtlW49O0ci2KBNoy5Y=",
  "pNV95cWaUurlo8luq5mZ5LWWjsA1A0g4nExzmDh+1u0=",
  "bSK/0yP6q/u7ALtRDxMmyse8eO86LQgBZjiBWcWIuR4=",
  "urktlQLd8UpJNLUtBHVvpCgFRggwuEkxfWdBR102s+w=",
  "LLRdTTRlj6coFcng6+fB8fl+kLvF5amyyjQEg1iq6p0=",
  "sdYeVWy/H/8M2zw2YJ8PmccawkHqFRO4DBt5PIeUqoM=",
  "a4rW/BM7oZsI3TNQmkLFOOcA2qczsPw80DSkbuWnlX0=",
  "H+VpdDA/FHbnW0a2aQdnIFLGwkPJt3t5phsc+YURgmg=",
  "oIsrAj26cN9twnNZu5AdJDwRqMROf5KySh+c2I9sqTg=",
  "zrz5sa/c0cnDeVuaW+Q8ki3BYAkj7GAyG2ZtAtx4GXo=",
  "s6hW8rNKgXdzlCYlrQeeSLmayN5XMnuuucmaIEifbaY=",
  "colHZ5szaH3jvbvngOp7D9ZiWcIvffL/q48g3QHvKYk=",
  "69xvlvMdRNAP0dZob0iCuPsrEJu+XwQDLrqLXCAFth4=",
  "ueVYg5bhxSq13eRLDUQGRzXRWOhuJIb9OV6As/FVeko=",
  "HkbCq9CVPyfwgMDi0h1FPk2ASuOfhgqMNlKDwqcQM9c=",
  "ty3nOq2l+ZJgHrb/9a202EpAR979tVlii/a6fpiWIX8=",
  "JHYUgzK18LkXNahrtGzhLcv7wBry7RbknsvffHJOYzk=",
  "hfts6tDL0zX23iVhD8TqD0gLJrc0+4bU1tp3SjW1i9Q=",
  "y4htIeFNJWf/yneLfexeGOBuaQuNIo0/Pb5/FyHQizk=",
  "yTZVHfo2D2Y9ZLIE6+dXFL00qbCVTrisOQsbZKMA9dE=",
  "yY+64+vCptZa+j2fZGyq4e/xNDJ/UPmA5bIolnVPtPg=",
  "EzM0QfHRmR7kIUz9RCrjdfzdahM8Mx9x9Jm/9ObHerg=",
  "Sf69cYFwXoDKk8zlvTHzwyqrDbJq0Q7EbJuClPioSms=",
  "p1HI+dfGaMd3MM89DdWSgXgrMfOsTDeoBwYj1jSytm4=",
  "2TPDZhqGSLqe7BaqSuES367ZKbk5o35J9f6TK/YzhHc=",
  "DvDNrXDaQRmhaxAPysdOu3An5nShE8w3IKh4epPzS6I=",
  "p9aVipMb4qGyVfeBCN6MeN0Ic+yPtAZyTJPaheXhg88=",
  "SNdEliT61auaD6aqF/SkFqe0dcKZfUrBckUr917AAY4=",
  "pcZ5APLDi9YvyoHFKbjX2Kune8sKvisxt9aNuenqoSc=",
  "MvO3eTkz4jA0EIQCBP5+T3xkqEDG15SwiI7QMzHcrHc=",
  "YwWEy24HBBP+yMXdSxAnT8aBWbj8wOD1YDghLpsmUSI=",
  "Bly+OSKiNMVuGqBO5OtqyiozAeke3f9+jB92lBUZ1CY=",
  "IdKf2EOovFFQV1ODvm1lo9sSHZXwe2UGInoFrwNy67Y=",
  "ciC6n6LX5BO1Kkn0kFeejtWicm9v9rjQU/vggcUlpi0=",
  "u22MCQMC/n2yNIFZQf4Hu+qicXkwekU4vUYC4vSXVVY=",
  "vnqxxZ3Q/eiPUuTfKqxYhfeFRKHj0na16kLuL+z49ZQ=",
  "j6XfAgoPRmJwvL21QE9rdmGZlUTsbGy1TT9UHWtWD6Y=",
  "6qqIHD0qzlvD4EqH2CGlvjWNZLXDX1n6mnEqq8Kfd4k=",
  "wsVQy2TQCrz1zToSjp78TIcX0WbZD3Fl8ScWJTtAg8g=",
  "UZOr9qoqQRz2LQ/RzpqDgXUQuf8+ph300qe1hlDy8II=",
  "162bDMXB3+M27vDt2S5wbeHOhGKYVYjAko7CcDYcg9g=",
  "KTWkCzhIBWXBIgfxy5ghi6ak7dQKFtdG8/8evKuBukg=",
  "z6L/Y4+ZPW23uoNf2ylXLBAFumf5Qgx6Oy/JoTA6FNg=",
  "VN8+V8csaWQxjHL83Bu5px04DFuH+atHPx5apGBq1p4=",
  "cC5VoQyVrBofGi7eSo+iR29fJL9jKk9QN4AfaVFXPck=",
  "DZcYGgxd0Kwy792fevETIyXwhzRmfYFZpJw99UyWnjk=",
  "qUc1B4wlpSotVKfV48N0mJ9Ib1fi1WnRMOZcuYnJ6bo=",
  "a417H7hUk1USOwhI8le3Ev9gLOD1Zr5krLwRFt80AQc=",
  "0weG9mBi6BRsacNOPoYXrwXzbgZEi6PGM2qrsg/P/ZI=",
  "HgsbBaE30vzGFTOaH8GftAT5wYjXBShCe693y8qM/YQ=",
  "E8w3y4JepGkDp4Elb+d3Wx3g3bwT4AOfSEKH68+OP90=",
  "dmTU1q0MnwYli1HIA207vLHg2WSPKfdgTnTGxP+O+Oc=",
  "dmGEcvqbtgZGZOBd99QVR+0X4LbsbMLrvCrES9tVPig=",
  "GTYVESGYH/g1F/EI5tVSg8+GhcVnFLxy77lF6ehMJJM=",
  "2WPQJQa82nv971nPq4gsiDIff6YbTukzyjSVDqhCz7o=",
  "aZS29NfRjmKXdERQQhiZDCgJ11NrgiHXHwiXjhX+OG8=",
  "ggGQnh4pgs2zDKc5NT2ojLBuY8gDrhXbqLxWC4xkxhw=",
  "uJnwZcC+Vqv/hdy6/U4wAfdc9f7Wtgaml9xvG8GgIas=",
  "NxRjSeRxB9Lo56JPfqsdKW+XMlW03T3hMRIOZmGcCQo=",
  "5MJ2aSou6bm3N7f/CL1rYT43f09VE2He8fe0Z38SjIQ=",
  "d7Ej1ZSauBrV1OLoHp0izLGNl9pW9Zc3hj2v6wrktOk=",
  "3JFgac3VSn8ujp5fdOXa+vwRCj1UFruPiaIu6ei/iTs=",
  "8lQF9DeHQefnD6XsKFttruq8pfVdW6ZPzEhNHSqwC5A=",
  "8lf/H3LTt0XZziUMo2l5HyBbT/s08TFjEuPRmFOM+kk=",
  "p42m8A0htGV8pvJMMiw8mIVcK6ZW1cN1CbDx/mCaZxU=",
  "7Jwr9OlkcsbyAMP9vVLZXY5svzGXmftW/lrf/aPjWdA=",
  "aYBfg2CStuWNM9p+oFDwEh4PJu9AYTrSdwLLQ/TgHqA=",
  "rmjwWxP6svFadVrd5SaM08rmFxblFdkBb+dBucMTQ/c=",
  "VicOuzS4dKhwymw1yEv6v8m6HfHVfyVkZON4cCzk/r0=",
  "6fgFP280humyeTOsTHhx9JNDli5O0O2/6wH+PJJHVmY=",
  "D6WWevz/uKmjSGEL3uFzasx0DjfpaEsblhVG0e12YnI=",
  "it8Ee4CFv1UbdlT7X1hjGggqUyZe0DYw8voVBw4CQic=",
  "74w+0FzxE2SavJIl6ztovV++ySmXIas5MZ9H02kCN5I=",
  "qlVSfuS4TDekrs9lPZQUhwfDpYHYUZZB6zeNFsVdg0E=",
  "75OwKyHYlwkMD0Z0KN5ChMqxdAzM0yQ8R7+FucMKB7k=",
  "n1P2WRP+BDapx7ByeLZDZjm0L5IPBL9I+tD34AObEs8=",
  "LHlDk7HUwWvbchqysHOhdGX2Wk27vq7P9UUTgnNafsA=",
  "6ZaxhBGoKCqz7pwU+H03SuTUGNZOzhXFYUi477wf6SI=",
  "1HoB51FQZnP3S7OhRfnIShLUJjTk0o/hfQws3uDoAUQ=",
  "UypL5pLirxaM+LfKgQVVPwl2e8hKSauP4tYoAti7GDk=",
  "nH8rAYbInnGBhsmENTPznC0OuuZQqbePbwJCBtavne8=",
  "GeZJ/b2Hm0szD9Bpw+EdVohj4oQAG6IvUd/7QmIMQo4=",
  "Pu31feTY/rHVcNJtuWCjVwTP4vj1gj8vLmr9ejwIOT0=",
  "SNjx0Tkj3tBQ6Ks64SRi1eqMMr90RlUmz/8+Dnz08dQ=",
  "6mMlLEESPgtEriaQp7VhQVQDkCEtSKh4XqLNlEsx26M=",
  "liBi7ekLtFVTSzwPhpT/ezo1MLZtSyJ6cdESJSSXyhs=",
  "Wu3JRA9+kwvFrx2f1iMf4qyuLBUowUD+sKyzTLqBJ2c=",
  "atqJuRMwPV9x5IEVCyFchgqOoU08cUHFrJX4GmDFfbY=",
  "sd/18blKhizdQhi8wsQmVANhlrVCgU3+u7HEx1AZZ1Y=",
  "i0aGZSzXaWw/cOp1VcLt3l15EDq/8C2RON5DivNn//M=",
  "fvUPurGTw5u3Ck15vs4VS7Hqmup3jX0MLBAoQ2GxVIY=",
  "UveV+2yRoot3XGyR+wg/qDZVgFoS1kTTrJG/2/ZY4J4=",
  "3BYq5SjblLCiziGAy2n6yhHD+vrFDtRN3YnWVaWudK4=",
  "nY4xwoOWur7N1hdUkpdA8bIZmVQuyHNshwpWuKX1L4I=",
  "fedX5HyV+kV7Z2tFfuxxEL4iURCQAToL+aDBYlIBqqY=",
  "6FKe+GFNukrQF4Wl1UVsckInjAUweowXLT92Ogfbg18=",
  "DxwtI7f4PdxOwXfoOdoxOzh9HprUpoja+AUWSy4HZt0=",
  "DszY8xKG2llkONa+vSNeRhIRoB098ZdJzUVymT8JwNg=",
  "c2KsC8Zk+gJICT18aDoHnfjPDhwsLHaD7JttHpJY0Ik=",
  "mrBU2+0cLlkkAvTLp0rlNu7K0BI0USnbjAI7U7jW1u8=",
  "Z5GKJCKhvgkpctTuXzsnk+BrFrxIXMSowIYyrWeuRAY=",
  "DhypIMxYKpZflv6WZVFJWs+xSouFRs1PwgdOeTao7Iw=",
  "mSt9HqzbjLFZICE/PGQU4oK6KTK0Dc3ZFNPU683eQLo=",
  "ot8rflPG8k3PAb47N5+W7elG1YHhfazlcSAkZWl2bpk=",
  "BA5XpC/oCRc52udZ9fTGqh8gmJOAFzJ2vun9I04u5EE=",
  "DlRQhz7OMWwISrMssoHb6Cz55LtpFZ4N3jJdVj7ovZI=",
  "scV7XKJrM6mN0aRWmN926TmCiZNk1IEz+tjRsvg3ZUc=",
  "5PNqoIYrYCRGMi7p6hLHeP2K9M0H8v99BrJ3KIfCcgI=",
  "vBcMhPo6vWpbOOjmsEu1NDa7ie34AW7ocO0fiuRc4ok=",
  "VLcvrkeU88eLLIed2BvJqfVmsf/8tRCLP0LsMDSnLf0=",
  "qPHxpwnPYUGi/fVpvuJ0y4/tYNpGzrMvCM1G4pqZobg=",
  "FiVDoXPKWkG6yNUblPbIyn1KUrJ7znjEIzk6BnYSTaw=",
  "xJ/+zoHXE6pQUTOQLIAAlJGfO3VKAOGg8m3qSSvGCgU=",
  "OwqoREygdoVLrNGia5sbgjzVT1kiT0kiqY2ixVAeCfw=",
  "dBr1tqtqaCDamTafSHoWtOsG4rah8J8gkpGXIjDoOW0=",
  "LGDZ4lOTjBh05vFyZ0uzkPAqqCGpt6vmFL6PwcHAJFE=",
  "e8MeSpVel0bfJCC+MQSD7vLgFVDrTbVOeMzREeCEb0c=",
]

/*Users.addView("areWeNuked", function () {
  return {
    selector: {
      petrovCodesEnteredHashed: {$in: hashedPetrovLaunchCodes}
    },
  }
})
ensureIndex(Users, {petrovCodesEnteredHashed: 1})*/



Users.addView("walledGardenInvitees", function () {
  return {
    selector: {
      walledGardenInvite: true
    },
    options: {
      sort: {
        displayName: 1
      }
    }
  }
})
ensureIndex(Users, {walledGardenInvite: 1})
