import type { Express } from "express";
import { getContextFromReqAndRes, getUserFromReq } from "./vulcan-lib/apollo-server/context";
import express from "express";
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { clientIdMiddleware } from "./clientIdMiddleware";
import Posts from "./collections/posts/collection";

/**
 * Endpoint to get similar posts by embeddings and calculate average frontpageness
 */
export function addSimilarPostsEndpoint(app: Express) {
  const router = express.Router();
  router.use(express.json());
  router.use(clientIdMiddleware);

  router.post("/getSimilarPosts", async (req, res) => {
    try {
      const { postId } = req.body;

      if (!postId) {
        return res.status(400).json({ error: "Missing postId parameter" });
      }

      const context = await getContextFromReqAndRes({ req, res, isSSR: false });
      const currentUser = getUserFromReq(req);

      // Find the post
      const post = await Posts.findOne({_id: postId});

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Use PostEmbeddingsRepo to find 6 similar posts (not weighted by quality)
      const similarPostIdsWithOriginal = await context.repos.postEmbeddings.getNearestPostIdsAndProductsByPostId(
        postId,
        200
      )

      const similarPostIds = similarPostIdsWithOriginal.filter(id => id !== postId);

      // Fetch the full post data for the similar posts, excluding the original post
      const similarPosts: DbPost[] = await Posts.find({
        _id: { $in: similarPostIds.map(({ _id }) => _id) },
        $and: [{ _id: { $ne: postId } }]
      }).fetch();

      // Calculate the average frontpageness weighted by the logistic of the vector product
      const logistic = (x: number) => 1 / (1 + Math.exp(-x));
      const identity = (x: number) => x;
      const frontpageTotalProduct = similarPosts.filter(post => post.frontpageDate !== null).reduce((sum, post) => sum + logistic(similarPostIdsWithOriginal.find(({ _id }) => _id === post._id)?.product ?? 0), 0);
      const totalProduct = similarPosts.reduce((sum, post) => sum + logistic(similarPostIdsWithOriginal.find(({ _id }) => _id === post._id)?.product ?? 0), 0);
      const averageFrontpageness = similarPosts.length > 0 ? frontpageTotalProduct / totalProduct : 0;

      console.log(frontpageTotalProduct, totalProduct, averageFrontpageness);

      // Return the results
      const response = {
        similarPosts: similarPosts.map(post => ({
          _id: post._id,
          title: post.title,
          frontpageDate: post.frontpageDate,
        })),
        averageFrontpageness,
        recommendedFrontpage: averageFrontpageness >= 0.5, // If 50% or more similar posts are on frontpage, recommend frontpage
      };

      const stream = Readable.from(JSON.stringify(response));
      res.setHeader('Content-Type', 'application/json');
      await pipeline(stream, res);
    } catch (error) {
      console.error("Error in similarPostsEndpoint:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.use('/api', router);
} 