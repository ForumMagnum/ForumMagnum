import ServerComponent from "./server"



export default async function Test() {
  const data: string = await fetch("http://localhost:3000/api/floop", {cache: "force-cache"})
    .then(res => new Promise(resolve => setTimeout(() => resolve(res.json()), 1000)))

  return <ServerComponent data={data} />
}
