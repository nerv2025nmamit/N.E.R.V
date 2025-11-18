'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { RefreshCw, AlertTriangle, Send, Star } from 'lucide-react';

// --- Types ---
interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  image?: string;
}

// --- Ancient Scroll Icon Component ---
const AncientScrollIcon = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 sm:h-16 sm:w-16 text-amber-500"
  >
    <defs>
      <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FDE047" />
      </linearGradient>
      <filter id="scrollGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <motion.path
      d="M10 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H10M14 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H14M10 3V21M14 3V21M10 3C10 4.65685 11.3431 6 13 6C14.6569 6 16 4.65685 16 3H14M10 21C10 19.3431 11.3431 18 13 18C14.6569 18 16 19.3431 16 21H14"
      stroke="url(#scrollGradient)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#scrollGlow)"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.15 }}
    />
  </svg>
);

// --- Animation Variants ---
const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
};

// --- Main Page ---
export default function TechNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // --- data fetchers (same as before) ---
  const fetchTechNews = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const newsPromises = [fetchNewsAPI(), fetchGuardianNews(), fetchRedditTechNews(), fetchHackerNews()];
      const results = await Promise.allSettled(newsPromises);
      let allNews: NewsItem[] = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          allNews = [...allNews, ...result.value];
        }
      });

      allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      const uniqueNews = allNews
        .filter((article, idx, self) => idx === self.findIndex((a) => a.title === article.title && a.url === article.url))
        .slice(0, 13);

      if (uniqueNews.length === 0) throw new Error('No news available; falling back to sample data');

      setNews(uniqueNews);
      setLastUpdated(new Date().toLocaleTimeString());
      setError('');
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Using sample tech news data');
      setNews(getSampleNews());
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // --- API helpers (kept as-is, keep your keys) ---
  const fetchNewsAPI = async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch(
        'https://newsapi.org/v2/top-headlines?country=us&category=technology&pageSize=6&apiKey=YOUR_API_KEY'
      );
      if (!response.ok) return getFallbackNews('NewsAPI');
      const data = await response.json();
      return data.articles?.map((a: any) => ({
        title: a.title || 'No title',
        description: a.description || 'No description available',
        url: a.url || '#',
        source: a.source?.name || 'NewsAPI',
        publishedAt: a.publishedAt,
        image: a.urlToImage,
      })) || getFallbackNews('NewsAPI');
    } catch {
      return getFallbackNews('NewsAPI');
    }
  };

  const fetchGuardianNews = async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch(
        'https://content.guardianapis.com/technology?api-key=test&show-fields=trailText,thumbnail&page-size=5'
      );
      if (!response.ok) return getFallbackNews('Guardian');
      const data = await response.json();
      return data.response?.results?.map((r: any) => ({
        title: r.webTitle,
        description: r.fields?.trailText || 'Technology news from The Guardian',
        url: r.webUrl,
        source: 'The Guardian',
        publishedAt: r.webPublicationDate,
        image: r.fields?.thumbnail,
      })) || getFallbackNews('Guardian');
    } catch {
      return getFallbackNews('Guardian');
    }
  };

  const fetchRedditTechNews = async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch('https://www.reddit.com/r/technology/hot.json?limit=8');
      if (!response.ok) return getFallbackNews('Reddit');
      const data = await response.json();
      return data.data?.children?.map((post: any) => ({
        title: post.data.title,
        description: `Upvotes: ${post.data.ups} | Comments: ${post.data.num_comments}`,
        url: `https://reddit.com${post.data.permalink}`,
        source: 'r/technology',
        publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
        image: post.data.thumbnail?.startsWith('http') ? post.data.thumbnail : undefined,
      })) || getFallbackNews('Reddit');
    } catch {
      return getFallbackNews('Reddit');
    }
  };

  const fetchHackerNews = async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      if (!response.ok) return getFallbackNews('HackerNews');
      const storyIds = await response.json();
      const topStoryIds = storyIds.slice(0, 5);
      const stories = await Promise.all(topStoryIds.map((id: number) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())));
      return stories.map((s: any) => ({
        title: s.title,
        description: `Score: ${s.score} | Comments: ${s.descendants || 0}`,
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        source: 'Hacker News',
        publishedAt: new Date(s.time * 1000).toISOString(),
      }));
    } catch {
      return getFallbackNews('HackerNews');
    }
  };

  const getFallbackNews = (source: string): NewsItem[] => {
    const currentDate = new Date().toISOString();
    return [
      {
        title: `Sample News from ${source}`,
        description: `Latest technology updates and innovations from ${source}.`,
        url: '#',
        source,
        publishedAt: currentDate,
      },
    ];
  };

  const getSampleNews = (): NewsItem[] => {
    const currentDate = new Date().toISOString();
    return [
      {
        title: 'AI Breakthrough: New Model Surpasses Human Performance',
        description: 'Groundbreaking AI model achieves unprecedented results in natural language understanding.',
        url: '#',
        source: 'TechCrunch (Sample)',
        publishedAt: currentDate,
        image: 'https://placehold.co/600x400/1e293b/eab308?text=AI+News',
      },
      // add more sample articles if needed
    ];
  };

  useEffect(() => {
    fetchTechNews();
    const interval = setInterval(() => fetchTechNews(true), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshNews = () => {
    fetchTechNews(true);
  };

  const featuredArticle = news.length > 0 ? news[0] : null;
  const regularArticles = news.length > 1 ? news.slice(1) : [];

  const sortedRegularArticles = useMemo(() => {
    return [...regularArticles].sort((a, b) => {
      if (a.image && !b.image) return -1;
      if (!a.image && b.image) return 1;
      return 0;
    });
  }, [regularArticles]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <AncientScrollIcon />
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mt-4">
          Gathering Intel...
        </h2>
        <p className="text-sm sm:text-lg text-slate-400 mt-2">Consulting the sources for the latest chronicles...</p>
        <div className="w-28 h-1 bg-amber-500/50 rounded-full mt-6 overflow-hidden">
          <motion.div className="h-full bg-amber-500" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }} className="max-w-7xl mx-auto px-4 sm:px-6 pb-safe pt-safe">
      {/* Header */}
      <div className="relative flex flex-col items-center text-center p-6 sm:p-8 mb-8 rounded-2xl border border-amber-500/8 bg-gradient-to-tr from-slate-900/50 to-slate-950/30 overflow-hidden">
        <AncientScrollIcon />
        <h1 className="mt-3 text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 font-serif tracking-wide">
          TECH-RONICLES
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl px-2">Intel from the front lines. Read the latest dispatches from the world of tech.</p>

        <div className="w-full mt-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            onClick={refreshNews}
            disabled={isRefreshing}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-semibold rounded-lg shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Chronicles'}
          </button>
          <div className="text-sm text-amber-500/70 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700">
            Last updated: {lastUpdated}
          </div>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-6 p-3 bg-red-900/50 border border-red-700/50 text-red-300 rounded-md flex items-center gap-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Featured Article (stack on mobile) */}
      {featuredArticle && (
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="group relative mb-8 flex flex-col md:flex-row bg-slate-900/50 border border-amber-500/20 rounded-2xl shadow-md overflow-hidden">
          {featuredArticle.image && (
            <div className="w-full md:w-1/2 h-48 md:h-auto overflow-hidden">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          <div className="flex flex-col p-4 md:p-6 md:w-1/2">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Featured
              </span>
              <span className="text-xs text-slate-500">{new Date(featuredArticle.publishedAt).toLocaleDateString()}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2 font-serif">{featuredArticle.title}</h2>
            <p className="text-sm text-slate-400 mb-4 line-clamp-3">{featuredArticle.description}</p>
            <a href={featuredArticle.url} target="_blank" rel="noopener noreferrer" className="mt-auto w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 bg-slate-800/70 text-amber-400 font-medium rounded-md transition-colors">
              Read Full Chronicle <Send className="w-4 h-4 ml-2" />
            </a>
          </div>
        </motion.div>
      )}

      {/* Staggered Grid (mobile-first) */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" variants={gridContainerVariants} initial="hidden" animate="visible">
        {sortedRegularArticles.map((item, idx) => (
          <motion.div key={`${item.url}-${idx}`} variants={gridItemVariants} className="group flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {item.image && (
              <div className="h-44 sm:h-48 overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs font-medium rounded-full">{item.source}</span>
                <span className="text-xs text-slate-500">{new Date(item.publishedAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white mb-2 flex-grow">{item.title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-3 line-clamp-3">{item.description}</p>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-auto w-full inline-flex items-center justify-center px-3 py-2 bg-slate-800/70 text-amber-400 font-medium rounded-md transition-colors">
                Read Chronicle <Send className="w-4 h-4 ml-2" />
              </a>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <style jsx>{`
        .pt-safe { padding-top: env(safe-area-inset-top, 12px); }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 12px); }
        @media (max-width: 640px) {
          .blur-3xl { filter: blur(6px); opacity: 0.6; } /* reduce heavy glare on phones */
        }
      `}</style>
    </motion.div>
  );
}