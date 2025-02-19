import type { Hit } from "react-instantsearch-core"

export type SearchHitComponentProps = {
  hit: Hit<AnyBecauseTodo>,
  clickAction?: any,
  classes: ClassesType<AnyStyles>,
  showIcon?: boolean
}
