import { Posts } from '../../lib/collections/posts';
import { registerMigration } from './migrationUtils';

registerMigration({
  name: "sscToAcx",
  dateWritten: "2022-06-05",
  idempotent: true,
  action: async () => {
    console.log("ASDF")
    console.log(await Posts.find({types:{$in:["SSC"]}}))

    const countSSC = await Posts.find({types:["SSC"]}).count()
    
    const countLWSSC = await Posts.find({types:["LW", "SSC"]}).count()
    const countSSCLW = await Posts.find({types:["SSC", "LW"]}).count()
    
    const countEASSC = await Posts.find({types:["EA", "SSC"]}).count()
    const countSSCEA = await Posts.find({types:["SSC", "EA"]}).count()

    const countSSCLWEA = await Posts.find({types:["SSC", "LW", "EA"]}).count()
    const countSSCEALW = await Posts.find({types:["SSC", "EA", "LW"]}).count()

    const countLWSSCEA = await Posts.find({types:["LW", "SSC", "EA"]}).count()
    const countLWEASSC = await Posts.find({types:["LW", "EA", "SSC"]}).count()

    const countEASSCLW = await Posts.find({types:["EA", "SSC", "LW"]}).count()
    const countEALWSSC = await Posts.find({types:["EA", "LW", "SSC"]}).count()

    console.log("done:", countSSC + countLWSSC + countSSCLW + countEASSC + countSSCEA + countSSCLWEA + countSSCEALW + countLWSSCEA + countLWEASSC + countEASSCLW + countEALWSSC)

    // Posts.rawUpdateMany({types:["SSC"]}, {$set:{types:["ACX"]}})
    
    // Posts.rawUpdateMany({types:["LW", "SSC"]}, {$set:{types:["LW", "ACX"]}})
    // Posts.rawUpdateMany({types:["SSC", "LW"]}, {$set:{types:["ACX", "LW"]}})
    
    // Posts.rawUpdateMany({types:["EA", "SSC"]}, {$set:{types:["EA", "ACX"]}})
    // Posts.rawUpdateMany({types:["SSC", "EA"]}, {$set:{types:["ACX", "EA"]}})

    // Posts.rawUpdateMany({types:["SSC", "LW", "EA"]}, {$set:{types:["LW", "ACX", "EA"]}})  
    // Posts.rawUpdateMany({types:["SSC", "EA", "LW"]}, {$set:{types:["LW", "ACX", "EA"]}})  

    // Posts.rawUpdateMany({types:["LW", "SSC", "EA"]}, {$set:{types:["LW", "ACX", "EA"]}})
    // Posts.rawUpdateMany({types:["LW", "EA", "SSC"]}, {$set:{types:["LW", "ACX", "EA"]}})    

    // Posts.rawUpdateMany({types:["EA", "SSC", "LW"]}, {$set:{types:["EA", "ACX", "LW"]}})
    // Posts.rawUpdateMany({types:["EA", "LW", "SSC"]}, {$set:{types:["EA", "LW", "ACX"]}})

  },
});
