import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Default to Hebrew for now
  // Future: detect from user preferences or URL
  const locale = 'he';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
