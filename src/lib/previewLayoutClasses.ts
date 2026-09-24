/** Layout class strings that respect admin preview frame width (not browser viewport). */
export function grid1Or2(isMobilePreview: boolean, cols2 = 'lg:grid-cols-2') {
  return isMobilePreview ? 'grid grid-cols-1' : `grid ${cols2}`;
}

export function grid1Or2Or3(isMobilePreview: boolean) {
  return isMobilePreview ? 'grid grid-cols-1' : 'grid sm:grid-cols-2 lg:grid-cols-3';
}

export function grid1Or2Or4(isMobilePreview: boolean) {
  return isMobilePreview ? 'grid grid-cols-1' : 'grid sm:grid-cols-2 lg:grid-cols-4';
}

export function grid1Or3(isMobilePreview: boolean) {
  return isMobilePreview ? 'grid grid-cols-1' : 'grid md:grid-cols-3';
}

export function sectionPadding(isMobilePreview: boolean, base = 'py-16 px-4') {
  return isMobilePreview ? base : `${base} md:py-24`;
}
