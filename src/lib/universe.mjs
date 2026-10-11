export const ARTICLE_PAGE_SIZE = 6;
export const INDEPENDENT_PREVIEW_SIZE = 2;

export function slicePage(items, requestedPage = 0, size = ARTICLE_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.max(0, Math.min(totalPages - 1, Math.trunc(requestedPage) || 0));
  return { items: items.slice(page * size, (page + 1) * size), page, totalPages, total: items.length };
}

export function filterStars(stars, query = '') {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return stars.filter((star) => words.every((word) => `${star.title} ${star.tags.join(' ')}`.toLocaleLowerCase().includes(word)));
}
