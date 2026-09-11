export interface ObserveData {
  documentId: string;
  documentType: 'post' | 'comment' | 'spotlight';
  postId?: string;
  servedEventId?: string;
  feedCardIndex?: number;
  feedCommentIndex?: number;
  feedType?: string;
}

const viewKey = (data: ObserveData) => data.servedEventId || `${data.documentType}:${data.documentId}`;

/** Owns registrations independently of React effects and analytics callback identity. */
export class UltraFeedViewTracker {
  private observer: IntersectionObserver | null = null;
  private targets = new Map<Element, ObserveData>();
  private timers = new Map<Element, ReturnType<typeof setTimeout>[]>();
  private viewed = new Set<string>();
  private longViewed = new Set<string>();
  private enabled = true;
  private activeFeedType?: string;

  constructor(private logView: (data: ObserveData, durationMs: number) => void) {}

  connect() {
    this.observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        this.cancelTimers(entry.target);
        if (entry.isIntersecting && this.canTrack(entry.target)) this.startTimers(entry.target);
      }
    }, { root: null, rootMargin: '-100px 0px -100px 0px', threshold: 0 });
    if (this.enabled) this.targets.forEach((_, element) => this.observer?.observe(element));
  }

  disconnect() {
    this.observer?.disconnect();
    this.observer = null;
    this.timers.forEach((_, element) => this.cancelTimers(element));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.timers.forEach((_, element) => this.cancelTimers(element));
    this.observer?.disconnect();
    if (enabled) this.targets.forEach((_, element) => this.observer?.observe(element));
  }

  setActiveFeedType(feedType?: string) {
    this.activeFeedType = feedType;
    // Resubscribe so switching feeds starts a fresh continuous visibility interval.
    this.setEnabled(this.enabled);
  }

  private canTrack(element: Element) {
    const data = this.targets.get(element);
    return this.enabled && !!data && (!this.activeFeedType || data.feedType === this.activeFeedType);
  }

  observe(element: Element, data: ObserveData) {
    this.cancelTimers(element);
    this.targets.set(element, data);
    if (this.enabled) this.observer?.observe(element);
  }

  unobserve(element: Element) {
    this.cancelTimers(element);
    this.observer?.unobserve(element);
    this.targets.delete(element);
  }

  private cancelTimers(element: Element) {
    this.timers.get(element)?.forEach(clearTimeout);
    this.timers.delete(element);
  }

  private startTimers(element: Element) {
    const data = this.targets.get(element);
    if (!data || this.longViewed.has(viewKey(data))) return;
    const timers = [1000, 10000].map(duration => setTimeout(() => {
      const current = this.targets.get(element);
      if (!this.canTrack(element) || !current || current !== data) return;
      const seen = duration === 1000 ? this.viewed : this.longViewed;
      if (seen.has(viewKey(data))) return;
      seen.add(viewKey(data));
      this.logView(data, duration);
      if (duration === 10000) this.observer?.unobserve(element);
    }, duration));
    this.timers.set(element, timers);
  }
}
