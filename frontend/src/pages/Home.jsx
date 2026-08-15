import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";
import "./Home.css";

const PIE_COLORS = ["#2563eb", "#38bdf8", "#a78bfa", "#f472b6", "#fb923c", "#34d399", "#facc15", "#94a3b8"];

export default function Home() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadArticles(activeCategory);
  }, [activeCategory]);

  async function loadStats() {
    setStatsLoading(true);
    try {
      const response = await api.get("/stats/public");
      setStats(response.data);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setStatsLoading(false);
    }
  }

  async function loadArticles(categoryId) {
    setArticlesLoading(true);
    try {
      const params = categoryId ? { category_id: categoryId } : {};
      const response = await api.get("/articles", { params });
      setArticles(response.data);
    } catch (err) {
      console.error("Failed to load articles", err);
    } finally {
      setArticlesLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) {
      setSearched(false);
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const response = await api.get("/search", { params: { q: query } });
      setSearchResults(response.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  }

  function clearSearch() {
    setQuery("");
    setSearched(false);
    setSearchResults([]);
  }

  const pieData = stats
    ? stats.categories_breakdown
        .filter((c) => c.article_count > 0)
        .map((c) => ({ name: c.name, value: c.article_count }))
    : [];

  const ratingBarData = stats
    ? [5, 4, 3, 2, 1].map((star) => ({
        star: `${star}★`,
        count: stats.feedback_distribution[String(star)] || 0,
      }))
    : [];

  return (
    <div className="home-layout">
      <div className="home-hero">
        <h1>Healthtech Knowledge Base</h1>
        <p>Search troubleshooting articles, track engagement, and stay on top of documentation activity.</p>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search articles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="home-grid">
        <aside className="home-col home-left">
          <div className="home-panel">
            <h3>Overview</h3>
            {statsLoading ? (
              <p className="home-panel-empty">Loading...</p>
            ) : stats ? (
              <div className="home-mini-stats">
                <div className="home-mini-stat">
                  <span className="home-mini-stat-value">{stats.total_articles}</span>
                  <span className="home-mini-stat-label">Articles</span>
                </div>
                <div className="home-mini-stat">
                  <span className="home-mini-stat-value">{stats.total_categories}</span>
                  <span className="home-mini-stat-label">Categories</span>
                </div>
                <div className="home-mini-stat">
                  <span className="home-mini-stat-value">{stats.total_feedback}</span>
                  <span className="home-mini-stat-label">Feedback</span>
                </div>
                <div className="home-mini-stat">
                  <span className="home-mini-stat-value">{stats.average_rating || "N/A"}</span>
                  <span className="home-mini-stat-label">Avg Rating</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="home-panel">
            <h3>Articles by Category</h3>
            {statsLoading ? (
              <p className="home-panel-empty">Loading...</p>
            ) : pieData.length > 0 ? (
              <div className="home-pie-wrapper">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="home-pie-legend">
                  {pieData.map((entry, index) => (
                    <div key={index} className="home-pie-legend-item">
                      <span
                        className="home-pie-dot"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="home-panel-empty">No data yet.</p>
            )}
          </div>

          <div className="home-panel">
            <h3>Categories</h3>
            {statsLoading ? (
              <p className="home-panel-empty">Loading...</p>
            ) : stats && stats.categories_breakdown.length > 0 ? (
              <ul className="home-category-list">
                <li
                  className={activeCategory === null ? "active" : ""}
                  onClick={() => setActiveCategory(null)}
                >
                  <span>All Articles</span>
                </li>
                {stats.categories_breakdown.map((c) => (
                  <li
                    key={c.id}
                    className={activeCategory === c.id ? "active" : ""}
                    onClick={() => setActiveCategory(c.id)}
                  >
                    <span>{c.name}</span>
                    <span className="home-panel-metric">{c.article_count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="home-panel-empty">No categories yet.</p>
            )}
          </div>
        </aside>

        <main className="home-col home-center">
          {searched ? (
            <div className="home-panel">
              <div className="home-panel-header-row">
                <h3>Search Results</h3>
                <button className="home-clear-search" onClick={clearSearch}>
                  Clear
                </button>
              </div>
              {searching ? (
                <p className="home-panel-empty">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="home-panel-empty">No articles matched your search.</p>
              ) : (
                <div className="home-article-list">
                  {searchResults.map((article) => (
                    <Link key={article.id} to={`/articles/${article.slug}`} className="home-article-card">
                      <h4>{article.title}</h4>
                      <p>{article.content}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="home-panel">
              <h3>{activeCategory ? "Category Articles" : "All Articles"}</h3>
              {articlesLoading ? (
                <p className="home-panel-empty">Loading articles...</p>
              ) : articles.length === 0 ? (
                <p className="home-panel-empty">No published articles in this category yet.</p>
              ) : (
                <div className="home-article-list">
                  {articles.map((article) => (
                    <Link key={article.id} to={`/articles/${article.slug}`} className="home-article-card">
                      <h4>{article.title}</h4>
                      <p>{article.content}</p>
                      <span className="home-article-views">{article.views} views</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="home-col home-right">
          <div className="home-panel">
            <h3>Most Viewed</h3>
            {statsLoading ? (
              <p className="home-panel-empty">Loading...</p>
            ) : stats && stats.top_viewed.length > 0 ? (
              <ul className="home-panel-list">
                {stats.top_viewed.map((a) => (
                  <li key={a.id}>
                    <Link to={`/articles/${a.slug}`}>{a.title}</Link>
                    <span className="home-panel-metric">{a.views} views</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="home-panel-empty">No view data yet.</p>
            )}
          </div>

          <div className="home-panel">
            <h3>Feedback Trends</h3>
            {statsLoading ? (
              <p className="home-panel-empty">Loading...</p>
            ) : stats ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={ratingBarData}>
                    <XAxis dataKey="star" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: "#f1f5f9" }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {stats.recent_feedback.length > 0 && (
                  <div className="home-recent-feedback">
                    {stats.recent_feedback.slice(0, 3).map((fb, i) => (
                      <div key={i} className="home-feedback-item">
                        <div className="home-feedback-top">
                          <span className="home-feedback-article">{fb.article_title}</span>
                          <span className="home-feedback-rating">{fb.rating}★</span>
                        </div>
                        {fb.comment && <p className="home-feedback-comment">"{fb.comment}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="home-panel-empty">No feedback yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}