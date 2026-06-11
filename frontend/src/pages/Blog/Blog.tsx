import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Home/components/Header';
import Footer from '../Home/components/Footer';
import './Blog.scss';

const POSTS = [
  {
    id: 1,
    slug: 'eta-accuracy-mena',
    category: 'Engineering',
    title: "How we achieve 99.7% ETA accuracy across Kuwait's road network",
    excerpt:
      "A deep dive into the machine learning pipeline, real-time traffic feeds, and graph-based routing that powers Etijahat's ETA Estimation API.",
    author: 'Etijahat Engineering',
    date: 'May 28, 2025',
    readTime: '8 min read',
    featured: true,
  },
  {
    id: 2,
    slug: 'last-mile-mena-trends',
    category: 'Industry',
    title: 'Last-mile delivery in MENA: 5 trends shaping 2025',
    excerpt:
      'From dark store proliferation to quick-commerce consolidation, we look at the forces transforming delivery logistics across the Gulf and beyond.',
    author: 'Etijahat Team',
    date: 'May 14, 2025',
    readTime: '5 min read',
    featured: false,
  },
  {
    id: 3,
    slug: 'route-optimizer-launch',
    category: 'Product',
    title: 'Introducing Route Optimizer API: AI-powered multi-stop planning',
    excerpt:
      'Our new Route Optimizer API uses A* pathfinding on the Armada road graph to find the fastest route across multiple stops for last-mile fleets.',
    author: 'Etijahat Product',
    date: 'April 30, 2025',
    readTime: '4 min read',
    featured: false,
  },
  {
    id: 4,
    slug: 'integrating-eta-api',
    category: 'Tutorial',
    title: 'Integrating the ETA API in 10 minutes with Node.js',
    excerpt:
      'A step-by-step walkthrough: create an API key, make your first request, and display delivery ETAs in your app — all in under 10 minutes.',
    author: 'Etijahat DevRel',
    date: 'April 15, 2025',
    readTime: '6 min read',
    featured: false,
  },
  {
    id: 5,
    slug: 'combined-api-best-practices',
    category: 'Tutorial',
    title: 'When to use the Combined API vs. individual endpoints',
    excerpt:
      "Choosing between /v1/combined and separate /v1/eta + /v1/distance calls can save you credits and latency. Here's how to decide.",
    author: 'Etijahat Engineering',
    date: 'March 22, 2025',
    readTime: '4 min read',
    featured: false,
  },
  {
    id: 6,
    slug: 'armada-road-graph',
    category: 'Engineering',
    title: 'Inside the Armada road graph: building a Kuwait-native routing engine',
    excerpt:
      "How we built and maintain a custom road-network graph for Kuwait, why OSRM wasn't enough, and what our A* implementation looks like in practice.",
    author: 'Etijahat Engineering',
    date: 'March 5, 2025',
    readTime: '10 min read',
    featured: false,
  },
];

const CATEGORIES = ['All', 'Engineering', 'Product', 'Industry', 'Tutorial'];

const categoryColor: Record<string, string> = {
  Engineering: '#1a73e8',
  Product: '#7c3aed',
  Industry: '#059669',
  Tutorial: '#d97706',
};

const Blog: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered =
    activeCategory === 'All'
      ? POSTS
      : POSTS.filter((p) => p.category === activeCategory);

  const featured = filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <div className="blog-page">
      <Header />

      <main>
        <section className="blog-hero">
          <div className="blog-container">
            <div className="blog-hero__badge">Blog</div>
            <h1 className="blog-hero__title">From the Etijahat team</h1>
            <p className="blog-hero__subtitle">
              Engineering deep dives, product updates, and logistics insights from the MENA region.
            </p>
          </div>
        </section>

        <section className="blog-content">
          <div className="blog-container">
            {/* Categories filter */}
            <div className="blog-categories">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`blog-category-btn ${activeCategory === cat ? 'blog-category-btn--active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Featured post */}
            {featured && (
              <Link to={`/blog/${featured.slug}`} className="blog-featured">
                <div className="blog-featured__meta">
                  <span
                    className="blog-featured__category"
                    style={{ color: categoryColor[featured.category] }}
                  >
                    {featured.category}
                  </span>
                  <span className="blog-featured__badge">Featured</span>
                </div>
                <h2 className="blog-featured__title">{featured.title}</h2>
                <p className="blog-featured__excerpt">{featured.excerpt}</p>
                <div className="blog-featured__footer">
                  <span className="blog-featured__author">{featured.author}</span>
                  <span className="blog-featured__dot">·</span>
                  <span className="blog-featured__date">{featured.date}</span>
                  <span className="blog-featured__dot">·</span>
                  <span className="blog-featured__read">{featured.readTime}</span>
                </div>
              </Link>
            )}

            {/* Post grid */}
            <div className="blog-grid">
              {rest.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="blog-card">
                  <div className="blog-card__category-wrap">
                    <span
                      className="blog-card__category"
                      style={{ color: categoryColor[post.category], background: `${categoryColor[post.category]}18` }}
                    >
                      {post.category}
                    </span>
                  </div>
                  <h3 className="blog-card__title">{post.title}</h3>
                  <p className="blog-card__excerpt">{post.excerpt}</p>
                  <div className="blog-card__footer">
                    <span className="blog-card__author">{post.author}</span>
                    <span className="blog-card__meta">{post.date} · {post.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
