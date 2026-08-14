import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Home.css";

export default function Home() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

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

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) {
      setSearched(false);
      setArticles([]);
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const response = await api.get("/search", { params: { q: query } });
      setArticles(response.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="page-container home-dashboard">
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

      {searched ? (
        <div className="search-results-section">
          <h2>Search Results</h2>
          {searching ? (
            <div className="empty-state">Searching...</div>
          ) : articles.length === 0 ? (
            <div className="empty-state">No articles matched your search.</div>
          ) : (
            <div className="article-list">
              {articles.map((article) => (
                <Link key={article.id} to={`/articles/${article.slug}`} className="article-card">
                  <h3>{article.title}</h3>
                  <p>{article.content}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {statsLoading ? (
            <div className="empty-state">Loading dashboard...</div>
          ) : stats ? (
            <>
              <div className="home-stat-strip">
                <div className="home-stat-box">
                  <div className="home-stat-value">{stats.total_articles}</div>
                  <div className="home-stat-label">Published Articles</div>
                </div>
                <div className="home-stat-box">
                  <div className="home-stat-value">{stats.total_categories}</div>
                  <div className="home-stat-label">Categories</div>
                </div>
                <div className="home-stat-box">
                  <div className="home-stat-value">{stats.total_feedback}</div>
                  <div className="home-stat-label">Feedback Submitted</div>
                </div>
                <div className="home-stat-box">
                  <div className="home-stat-value">{stats.average_rating || "N/A"}</div>
                  <div className="home-stat-label">Average Rating</div>
                </div>
              </div>

              <div className="home-panel-grid">
                <div className="home-panel">
                  <h3>Recently Published</h3>
                  {stats.recent_articles.length === 0 ? (
                    <p className="home-panel-empty">No articles published yet.</p>
                  ) : (
                    <ul className="home-panel-list">
                      {stats.recent_articles.map((a) => (
                        <li key={a.id}>
                          <Link to={`/articles/${a.slug}`}>{a.title}</Link>
                          <span className="home-panel-metric">{a.views} views</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="home-panel">
                  <h3>Most Viewed</h3>
                  {stats.top_viewed.length === 0 ? (
                    <p className="home-panel-empty">No view data yet.</p>
                  ) : (
                    <ul className="home-panel-list">
                      {stats.top_viewed.map((a) => (
                        <li key={a.id}>
                          <Link to={`/articles/${a.slug}`}>{a.title}</Link>
                          <span className="home-panel-metric">{a.views} views</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="home-panel">
                  <h3>Categories</h3>
                  {stats.categories_breakdown.length === 0 ? (
                    <p className="home-panel-empty">No categories yet.</p>
                  ) : (
                    <ul className="home-panel-list">
                      {stats.categories_breakdown.map((c) => (
                        <li key={c.id}>
                          <span>{c.name}</span>
                          <span className="home-panel-metric">
                            {c.article_count} article{c.article_count === 1 ? "" : "s"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">Unable to load dashboard data.</div>
          )}
        </>
      )}
    </div>
  );
}