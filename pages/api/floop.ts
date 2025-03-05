import { NextApiRequest, NextApiResponse } from "next"

export default async function floop(req: NextApiRequest, res: NextApiResponse) {
  console.log("floop\nfloop]\nfloop")
  await new Promise(resolve => setTimeout(resolve, 3000))
  return res.status(200).json({data: "data"})
}
