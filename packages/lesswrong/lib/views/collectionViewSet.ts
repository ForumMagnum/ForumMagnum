export class CollectionViewSet<N extends CollectionNameString, Views extends Record<string, ViewFunction<N>>> {
  public collectionName: N;
  private views: Views;
  private defaultView?: ViewFunction<N>;

  constructor(collectionName: N, views: Views, defaultView?: ViewFunction<N>) {
    this.collectionName = collectionName;
    this.views = views;
    this.defaultView = defaultView;
  }

  getDefaultView(): ViewFunction<N> | undefined {
    return this.defaultView;
  }

  getView<T extends keyof Views & string>(viewName: T): string extends T ? Views[T] | undefined : Views[T] {
    if (!this.views[viewName]) {
      // eslint-disable-next-line no-console
      console.warn(`View ${viewName} not found in collection ${this.collectionName}`);
      return undefined as string extends T ? Views[T] | undefined : Views[T];
    }
    return this.views[viewName];
  }

  getAllViews(): Views {
    return this.views;
  }
}
