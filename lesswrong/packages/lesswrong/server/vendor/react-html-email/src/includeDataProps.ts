export default function (props: any) {
  const dataProps: any = {}

  Object.keys(props).forEach((key: any) => {
    if (/^data-/.test(key)) {
      dataProps[key] = props[key]
    }
  })

  return dataProps
}
