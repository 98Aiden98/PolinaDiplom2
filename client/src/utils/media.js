const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
  /\/api\/?$/,
  '',
);

export const resolveMediaUrl = (url) => {
  if (!url) {
    return '';
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith('/uploads/')) {
    return `${apiBaseUrl}${url}`;
  }

  return url;
};
