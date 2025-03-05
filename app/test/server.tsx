import Component from "./client"

export default function ServerComponent(props: {data: string}) {
  const fetchPromise: Promise<string> = fetch("http://localhost:3000/api/floop", {cache: "no-cache"}).then(res => 
    new Promise(resolve => setTimeout(() => resolve(res.json()), 1000))
  )

  return <Component fetchPromise={fetchPromise} data={props.data} />
}
