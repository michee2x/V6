import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Standard search engine crawlers — full access to public pages
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',      // API routes — never indexed
          '/session/',  // User-specific session pages — private
          '/history',   // User history — private
        ],
      },
      // Google AI — allow full indexing for AI Overviews
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/session/', '/history'],
      },
      // OpenAI / ChatGPT — allow for GEO discovery
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/session/', '/history'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/', '/session/', '/history'],
      },
      // Perplexity AI — allow for GEO discovery
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/session/', '/history'],
      },
      // Anthropic / Claude — allow for GEO discovery
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/', '/session/', '/history'],
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
        disallow: ['/api/', '/session/', '/history'],
      },
    ],
    sitemap: 'https://recrea8.app/sitemap.xml',
  };
}
