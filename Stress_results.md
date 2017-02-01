# DB stress test results

## Construction

See my changes to the source in `packages/nova-getting-started/lib/server/dummy_content.js`. It populates the database with the following parameters upon app start.

## Parameters
* users = 2000
* posts = 30000
* upvotes per post = random integer(0, 20)
* comments per user = random integer(0, 10)

**Note**: The original test was supposed to be on (0, 500) comments per user, but the mongo JS client used in Telescope was simply too slow at populating this many (2000 x 500) comments, even after left running for an entire day.

Testing url was `198.199.111.153:3000`.

I tested the "daily" page, since unlike the other routes, it does not artificially restrict the number of results shown on the page, and is computed anew for each user.

All tests were performed sequentially.

## Test 1: daily page load x 10

Navigate to the `198.199.111.153:3000/daily`. 
In chrome dev tools, open the Timeline page and hit F5. The typical page load timeline looks like [this]().

Results:
```
1: 132 s
2: 127 s
3: 226 s
4: 195 s
5: 220 s
6: 231 s
7: 222 s
received "unexpected error" and the app quit. had to restart.
8: 227 s
9: 232 s
10: 238 s
mean: 205 s
```

## Test 2: daily page load using curl x 10

This tests the raw load speed without any rendering in the mix. 

Use the following command. 

```bash
$ curl -w '\nLookup time:\t%{time_namelookup}\nConnect time:\t%{time_connect}\nPreXfer time:\t%{time_pretransfer}\nStartXfer time:\t%{time_starttransfer}\n\nTotal time:\t%{time_total}\n' -o /dev/null -s http://198.199.111.153:3000/daily
```

Results:
```
1: 
Lookup time:  0.000
Connect time: 0.034
PreXfer time: 0.034
StartXfer time: 7.071

Total time: 7.839

2: 
Lookup time:  0.000
Connect time: 15.637
PreXfer time: 15.637
StartXfer time: 26.493

Total time: 28.417

3: 
Lookup time:  0.000
Connect time: 0.041
PreXfer time: 0.041
StartXfer time: 10.447

Total time: 11.887

4: 
Lookup time:  0.000
Connect time: 2.188
PreXfer time: 2.188
StartXfer time: 16.172

Total time: 23.602

5: 
Lookup time:  0.000
Connect time: 0.062
PreXfer time: 0.062
StartXfer time: 13.086

Total time: 13.305

6: 
Lookup time:  0.000
Connect time: 0.035
PreXfer time: 0.035
StartXfer time: 13.266

Total time: 13.394

7: 
Lookup time:  0.000
Connect time: 0.034
PreXfer time: 0.034
StartXfer time: 15.429

Total time: 15.572

8: 
Lookup time:  0.000
Connect time: 0.032
PreXfer time: 0.032
StartXfer time: 13.677

Total time: 13.826

9: 
Lookup time:  0.000
Connect time: 9.963
PreXfer time: 9.963
StartXfer time: 34.015

Total time: 35.347

10: 
Lookup time:  0.000
Connect time: 0.035
PreXfer time: 0.035
StartXfer time: 17.333

Total time: 18.783

mean: 
Lookup time:  0.000
Connect time: 2.806
PreXfer time: n/a
StartXfer time: n/a

Total time: 18.197
```

## Conclusion

The "daily" page (which loads ~40 posts) is _extremely_ slow to load in browser, taking about 3 minutes on every refresh. I would likely avoid ever loading this page.

The raw fetch speed using `curl` is substantially faster (although still quite slow by modern web standards), which makes me think the database operation is probably not the actual bottleneck. In fact, it was clear from chrome's network timeline that loading the massive javascript file into memory and rendering the page itself was the biggest time sink. 

There is also the confounding factor of connection time to the server ("Connect time" in the curl test), which has high variance. 
