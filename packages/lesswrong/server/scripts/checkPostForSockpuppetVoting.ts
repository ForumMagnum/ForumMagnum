/* eslint-disable no-console */
import { ClientIds } from "../../lib/collections/clientIds/collection";
import { Comments } from "../../lib/collections/comments";
import LWEvents from "../../lib/collections/lwevents/collection";
import Votes from "../../lib/collections/votes/collection";
import { Vulcan } from "../vulcan-lib";
import uniq from "lodash/uniq";
import intersection from "lodash/intersection";
import { wrapVulcanAsyncScript } from "./utils";

/**
 * Helper function for checkPostForSockpuppetVoting().
 *
 * Given a list of voterIds (i.e. userIds), look at their associated ClientId data,
 * and return a list of client IDs that were duplicated.
 */
const checkForDuplicateClientIds = async (voterIds: string[]): Promise<string[]> => {
  if (!voterIds.length) return []
  
  const clientIds = await ClientIds.find({
    userIds: {$in: voterIds}
  }, {projection: {clientId: 1, userIds: 1}}).fetch()
  
  const suspiciousClientIds = new Set<string>()
  for (let clientId of clientIds) {
    // Check if >1 voter is associated with this client ID
    if (clientId.clientId && clientId.userIds && intersection(clientId.userIds, voterIds).length > 1)
      suspiciousClientIds.add(clientId.clientId)
  }
  
  return Array.from(suspiciousClientIds)
}

// TODO: Use this once we fix $nin (see related TODO below)
const WHITELISTED_IPS = [
  '127.0.0.1'
]

/**
 * Helper function for checkPostForSockpuppetVoting().
 *
 * Given a list of voterIds (i.e. userIds), look at their associated IP data,
 * and return a list of IPs that were duplicated.
 *
 * This is still WIP, and is not currently that useful.
 * Ideally it would filter out whitelisted IPs (like known offices).
 */
const checkForDuplicateIPs = async (voterIds: string[]): Promise<Record<string, string[]>> => {
  if (!voterIds.length) return {}
  
  // Build a map of {IP: userIds}
  const ipUsers: Record<string, string[]> = {}
  for (let voterId of voterIds) {
    // Get a list of the voter's 5 latest IPs
    const loginEvents = await LWEvents.find({
      name: "login",
      userId: voterId,
      'properties.ip': {$ne: '127.0.0.1'}  // TODO: This doesn't seem to work, not sure why. Also $nin doesn't work. :(
    }, {limit: 5, sort: {createdAt: -1}, projection: {properties: 1}}).fetch()
    const ips = uniq(loginEvents.map(event => event.properties.ip))
    ips.forEach(ip => {
      if (ip in ipUsers) {
        ipUsers[ip].push(voterId)
      } else {
        ipUsers[ip] = [voterId]
      }
    })
  }
  
  // Return just the IPs that have >1 voter associated with them
  const suspiciousIps: Record<string, string[]> = {}
  Object.keys(ipUsers).filter(ip => ipUsers[ip].length > 1).forEach(ip => suspiciousIps[ip] = ipUsers[ip])

  return suspiciousIps
}


/**
 * Given a postId, this function will check the post and each comment on the post.
 * If, for any of these items, there are multiple voters who share a client ID, it will report them as potential sockpuppet voting.
 *
 * (Note that there are probably bugs around client ID, ex. I have seen analytics events with a client ID that doesn't exist in
 * the ClientIds table. Additionally, there are legit reasons for two people to have accounts associated with the same client ID,
 * ex. one person is using a shared company account that someone else has previously used. So this is not definitive proof of
 * sockpuppet voting.)
 *
 * It will also report if multiple users who voted on the post share a recent IP address. This part is still WIP, and most of
 * these cases are false positives since there are many legit reasons for users to be associated with the same IP.
 */
const checkPostForSockpuppetVoting = async (postId: string, voteDirection: 'up'|'down' = 'down', verbose = false) => {
  const voteTypes = voteDirection === 'up' ? ['smallUpvote', 'bigUpvote'] : ['smallDownvote', 'bigDownvote']
  
  // Get a list of userIds for users who voted on the post (in the given direction)
  const postVotes = await Votes.find({
    documentId: postId,
    collectionName: "Posts",
    voteType: {$in: voteTypes},
    cancelled: false,
    isUnvote: false
  }, {projection: {userId: 1}}).fetch()
  
  // Check for duplicate client IDs
  console.log(`Checking for duplicate client IDs within post ${voteDirection}voters...`)
  const postVoterIds = postVotes.map(v => v.userId)
  const postVoterSuspiciousClientIds = await checkForDuplicateClientIds(postVoterIds)
  if (verbose)
    console.log(`Client IDs associated with multiple post ${voteDirection}voters:`, postVoterSuspiciousClientIds)
  
  // Check for duplicate IPs
  // (This is more likely to be noise than to be helpful - feel free to comment this block out.)
  console.log(`Checking for duplicate IPs within post ${voteDirection}voters...`)
  const postVoterSuspiciousIps = await checkForDuplicateIPs(postVoterIds)
  if (verbose) {
    console.log(`IPs associated with multiple post ${voteDirection}voters:`)
    Object.keys(postVoterSuspiciousIps).forEach(ip => console.log(`${ip} (User IDs: ${postVoterSuspiciousIps[ip]})`))
  }
  
  // Then, go through all the post's comments
  const commentsSuspiciousClientIds: Record<string, string[]> = {}
  const comments = await Comments.find({
    postId,
    authorIsUnreviewed: false,
    rejected: false,
    deleted: false,
  }, {projection: {_id: 1}}).fetch()
  
  console.log(`Checking for duplicate client IDs within comment ${voteDirection}voters (${comments.length ?? 0} comments total)...`)
  for (let comment of comments) {
    // Get a list of userIds for users who voted on the comment (in the given direction)
    const votes = await Votes.find({
      documentId: comment._id,
      collectionName: "Comments",
      voteType: {$in: voteTypes},
      cancelled: false,
      isUnvote: false
    }, {projection: {userId: 1}}).fetch()
    
    // Check for duplicate client IDs
    const voterIds = votes.map(v => v.userId)
    const voterSuspiciousClientIds = await checkForDuplicateClientIds(voterIds)
    if (verbose)
      console.log(`Client IDs associated with multiple ${voteDirection}voters of comment ${comment._id}:`, voterSuspiciousClientIds)
    if (voterSuspiciousClientIds.length)
      commentsSuspiciousClientIds[comment._id] = voterSuspiciousClientIds
    
    // Note that we don't check comments for duplicate IPs. Feel free to add that if you think it would be helpful.
    // For now they are almost all false positives so I think it would just create noise.
  }
  
  // Print out a summary of the findings
  console.log('~~~~~ SUMMARY ~~~~~')
  if (postVoterSuspiciousClientIds.length) {
    console.log(`Client IDs associated with multiple post ${voteDirection}voters:`, postVoterSuspiciousClientIds)
  } else {
    console.log(`Found no client IDs associated with multiple post ${voteDirection}voters.`)
  }
  if (Object.keys(postVoterSuspiciousIps).length) {
    console.log(`IPs associated with multiple post ${voteDirection}voters (with their associated userIds):`, postVoterSuspiciousIps)
  } else {
    console.log(`Found no IPs associated with multiple post ${voteDirection}voters.`)
  }
  
  console.log(`Comments where we found client IDs associated with multiple ${voteDirection}voters (with the relevant client IDs):`, commentsSuspiciousClientIds)
}

Vulcan.checkPostForSockpuppetVoting = wrapVulcanAsyncScript('checkPostForSockpuppetVoting', checkPostForSockpuppetVoting)
