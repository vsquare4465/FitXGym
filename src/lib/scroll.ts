/** Jump the window without CSS `scroll-behavior: smooth` (WebKit treats even `auto` as smooth). */
export function jumpToTop() {
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  html.scrollTop = 0;
  document.body.scrollTop = 0;
  window.scrollTo(0, 0);
  html.style.scrollBehavior = prev;
}

export function jumpToId(id: string, focus = false) {
  const el = document.getElementById(id);
  if (!el) {
    jumpToTop();
    return;
  }
  const html = document.documentElement;
  const prev = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  const header = document.querySelector('header');
  const offset = (header instanceof HTMLElement ? header.offsetHeight : 72) + 8;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo(0, Math.max(0, top));
  html.style.scrollBehavior = prev;
  if (focus && 'focus' in el) {
    (el as HTMLElement).focus({ preventScroll: true });
  }
}
