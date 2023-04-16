import { Child, RootOptions } from './types';

/**
 * Extended Intersection Observer.
 */
export class Observer {
  observer: IntersectionObserver;
  children: Child[] = [];
  options: RootOptions;
  private connected = false;
  constructor(
    callback: (entries: IntersectionObserverEntry[], observer: Observer) => void, 
    options: RootOptions = {}
  ) {
    this.options = options;
    this.observer = new IntersectionObserver(entries => callback(entries, this), this.options);
    this.connected = true;
  }
  addChild(target: Child) {
    this.children.indexOf(target) < 0 && this.children.push(target);
  }
  deleteChild(target: Child) {
    const idx = this.children.indexOf(target);
    idx >= 0 && this.children.splice(idx, 1);
  }
  observe(target: Child): void {
    this.observer.observe(target);
    this.options.useVisibility && this.addChild(target);
  }
  unobserve(target: Child): void {
    this.observer.unobserve(target);
    this.deleteChild(target);
  }
  disconnect(): void {
    this.connected && this.observer.disconnect();
    this.connected = false;
  }
  reconnect(): void {
    !this.connected && this.children.forEach(t => this.observer.observe(t));
    this.connected = true;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return this.observer.takeRecords();
  }
}