'use client';

import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { RefreshCw, AlertTriangle, Send, Star } from 'lucide-react'; // Added Star icon

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
    className="h-16 w-16 text-amber-500"
  >
    <defs>
      <linearGradient id="scrollGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FDE047" />
      </linearGradient>
      <filter id="scrollGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <motion.path
      d="M10 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H10M14 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H14M10 3V21M14 3V21M10 3C10 4.65685 11.3431 6 13 6C14.6569 6 16 4.65685 16 3H14M10 21C10 19.3431 11.3431 18 13 18C14.6569 18 16 19.3431 16 21H14"
      stroke="url(#scrollGradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#scrollGlow)"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.5, delay: 0.2 }}
    />
  </svg>
);

// --- NEW: Animation Variants for Grid ---
const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Each card animates 0.1s after the previous
    },
  },
};

const gridItemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// --- Main Page Component ---
export default function TechNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // --- All your data fetching logic (unchanged) ---
  const fetchTechNews = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const newsPromises = [
        fetchNewsAPI(),
        fetchGuardianNews(),
        fetchRedditTechNews(),
        fetchHackerNews(),
      ];

      const results = await Promise.allSettled(newsPromises);
      let allNews: NewsItem[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
          allNews = [...allNews, ...result.value];
        }
      });

      // --- Sort by date before slicing ---
      // This ensures the newest article is always first
      allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      const uniqueNews = allNews
        .filter((article, index, self) => 
          index === self.findIndex(a => a.title === article.title && a.url === article.url)
        )
        .slice(0, 13); // Get 13 articles (1 featured + 12 grid)

      if (uniqueNews.length === 0) {
        throw new Error('No news available from APIs, using sample data');
      }

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

  const fetchNewsAPI = async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch(
        'https://newsapi.org/v2/top-headlines?country=us&category=technology&pageSize=6&apiKey=YOUR_API_KEY' // <-- IMPORTANT: Add your own NewsAPI key here if you have one
      );
      if (!response.ok) {
        console.log('NewsAPI failed, using fallback');
        return getFallbackNews('NewsAPI');
      }
      const data = await response.json();
      return data.articles?.map((article: any) => ({
        title: article.title || 'No title',
        description: article.description || 'No description available',
        url: article.url || '#',
        source: article.source?.name || 'NewsAPI',
        publishedAt: article.publishedAt, // Keep original date for sorting
        image: article.urlToImage
      })) || getFallbackNews('NewsAPI');
    } catch (error) {
      console.log('NewsAPI error:', error);
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
      return data.response?.results?.map((article: any) => ({
        title: article.webTitle,
        description: article.fields?.trailText || 'Technology news from The Guardian',
        url: article.webUrl,
        source: 'The Guardian',
        publishedAt: article.webPublicationDate, // Keep original date
        image: article.fields?.thumbnail
      })) || getFallbackNews('Guardian');
    } catch {
      return getFallbackNews('Guardian');
    }
  };

  const fetchRedditTechNews = async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch(
        'https://www.reddit.com/r/technology/hot.json?limit=8'
      );
      if (!response.ok) return getFallbackNews('Reddit');
      const data = await response.json();
      return data.data?.children?.map((post: any) => ({
        title: post.data.title,
        description: `Upvotes: ${post.data.ups} | Comments: ${post.data.num_comments}`,
        url: `https://reddit.com${post.data.permalink}`,
        source: 'r/technology',
        publishedAt: new Date(post.data.created_utc * 1000).toISOString(), // Convert to ISO string
        image: post.data.thumbnail?.startsWith('http') ? post.data.thumbnail : undefined
      })) || getFallbackNews('Reddit');
    } catch {
      return getFallbackNews('Reddit');
    }
  };

  const fetchHackerNews = async (): Promise<NewsItem[]> => {
    try {
      const response = await fetch(
        'https://hacker-news.firebaseio.com/v0/topstories.json'
      );
      if (!response.ok) return getFallbackNews('HackerNews');
      const storyIds = await response.json();
      const topStoryIds = storyIds.slice(0, 5);
      const storyPromises = topStoryIds.map((id: number) => 
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      );
      const stories = await Promise.all(storyPromises);
      return stories.map((story: any) => ({
        title: story.title,
        description: `Score: ${story.score} | Comments: ${story.descendants || 0}`,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        source: 'Hacker News',
        publishedAt: new Date(story.time * 1000).toISOString(), // Convert to ISO string
      }));
    } catch {
      return getFallbackNews('HackerNews');
    }
  };

  const getFallbackNews = (source: string): NewsItem[] => {
    const currentDate = new Date().toISOString();
    return [{
      title: `Sample News from ${source}`,
      description: `Latest technology updates and innovations from ${source}. (Using sample data as API failed)`,
      url: '#',
      source: source,
      publishedAt: currentDate
    }];
  };

  const getSampleNews = (): NewsItem[] => {
    const currentDate = new Date().toISOString();
    return [
      {
        title: "AI Breakthrough: New Model Surpasses Human Performance",
        description: "Groundbreaking AI model achieves unprecedented results in natural language understanding.",
        url: "#",
        source: "TechCrunch (Sample)",
        publishedAt: currentDate,
        image: "https://placehold.co/600x400/1e293b/eab308?text=AI+News"
      },
      // ... (other sample news)
    ];
  };

  useEffect(() => {
    fetchTechNews();
    const interval = setInterval(() => fetchTechNews(true), 2 * 60 * 1000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const refreshNews = () => {
    console.log('Manual refresh triggered');
    fetchTechNews(true);
  };

  // --- NEW: Split news into featured and regular ---
  const featuredArticle = news.length > 0 ? news[0] : null;
  const regularArticles = news.length > 1 ? news.slice(1) : [];

  // --- NEW: Sort regular articles to show imaged ones first ---
  const sortedRegularArticles = useMemo(() => {
    return regularArticles.sort((a, b) => {
      if (a.image && !b.image) return -1; // a (with image) comes first
      if (!a.image && b.image) return 1; // b (with image) comes first
      return 0; // retain original order if both have/don't have images
    });
  }, [regularArticles]);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <AncientScrollIcon />
        </motion.div>
        <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mt-6">
          Gathering Intel...
        </h2>
        <p className="text-lg text-slate-400 mt-2">
          Consulting the sources for the latest chronicles...
        </p>
        <div className="w-16 h-1 bg-amber-500/50 rounded-full mt-8 overflow-hidden">
          <motion.div
            className="h-full bg-amber-500"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    );
  }

  // --- Main Page Content ---
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto"
    >
      {/* --- Header --- */}
      <div className="relative flex flex-col items-center text-center p-8 mb-12 rounded-2xl border border-amber-500/10 bg-gradient-to-tr from-slate-900/50 to-slate-950/30 overflow-hidden">
        <AncientScrollIcon />
        <h1 className="mt-4 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 font-serif tracking-widest">
          TECH-RONICLES
        </h1>
        <p className="mt-2 text-lg text-slate-400 max-w-xl">
          Intel from the front lines. Read the latest dispatches from the world of tech.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={refreshNews}
            disabled={isRefreshing}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-amber-500/40 group flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh Chronicles'}
          </motion.button>
          <div className="text-sm text-amber-500/70 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            Last updated: {lastUpdated}
          </div>
        </div>
      </div>

      {/* --- Error Message --- */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-4 bg-red-900/50 border border-red-700/50 text-red-300 rounded-lg flex items-center text-sm gap-3"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- NEW: Featured Article --- */}
      {featuredArticle && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="group relative mb-12 flex flex-col md:flex-row bg-slate-900/50 border border-amber-500/30 rounded-2xl shadow-xl shadow-amber-500/10 overflow-hidden"
        >
          {featuredArticle.image && (
            <div className="md:w-1/2 h-64 md:h-auto overflow-hidden">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex flex-col p-6 md:p-8 md:w-1/2">
            <div className="flex justify-between items-center mb-4">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-full flex items-center gap-1.5">
                <Star className="w-3 h-3" /> Featured
              </span>
              <span className="text-xs text-slate-500">
                {new Date(featuredArticle.publishedAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 flex-grow font-serif">
              {featuredArticle.title}
            </h2>
            <p className="text-sm text-slate-400 mb-6 line-clamp-2">
              {featuredArticle.description}
            </p>
            <a
              href={featuredArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center justify-center w-full px-4 py-3 bg-slate-800/70 text-amber-400 font-medium rounded-lg transition-all duration-300 group-hover:bg-amber-500 group-hover:text-slate-900 group-hover:shadow-lg group-hover:shadow-amber-500/20"
            >
              Read Full Chronicle <Send className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </motion.div>
      )}

      {/* --- NEW: Staggered News Grid --- */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {sortedRegularArticles.map((item, index) => ( // Use sortedRegularArticles
          <motion.div
            key={`${item.url}-${index}`}
            variants={gridItemVariants}
            className="group flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 hover:!scale-[1.03] hover:-translate-y-1.5"
          >
            {item.image && (
              <div className="h-48 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="px-3 py-1 bg-slate-800 text-slate-400 text-xs font-medium rounded-full">
                  {item.source}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(item.publishedAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex-grow">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                {item.description}
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center w-full px-4 py-2 bg-slate-800/70 text-amber-400 font-medium rounded-lg transition-all duration-300 group-hover:bg-amber-500 group-hover:text-slate-900 group-hover:shadow-lg group-hover:shadow-amber-500/20"
              >
                Read Chronicle <Send className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}