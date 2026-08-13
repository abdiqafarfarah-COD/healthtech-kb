import { useState, useEffect } from "react";
import api from "../services/api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/dashboard");
      setStats(response.data);
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="page-container">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of knowledge base activity</p>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="stat-value">{stats.total_articles}</div>
          <div className="stat-label">Total Articles</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.published_articles}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.draft_articles}</div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.total_users}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.total_categories}</div>
          <div className="stat-label">Categories</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h3>Top Articles by Views</h3>
          {stats.top_articles.length === 0 ? (
            <p className="panel-empty">No view data yet.</p>
          ) : (
            <ul className="panel-list">
              {stats.top_articles.map((a) => (
                <li key={a.id}>
                  <span>{a.title}</span>
                  <span className="panel-metric">{a.views} views</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-panel">
          <h3>Low-Rated Articles</h3>
          {stats.low_rated_articles.length === 0 ? (
            <p className="panel-empty">No low-rated articles.</p>
          ) : (
            <ul className="panel-list">
              {stats.low_rated_articles.map((a) => (
                <li key={a.id}>
                  <span>{a.title}</span>
                  <span className="panel-metric warning">
                    {a.avg_rating.toFixed(1)} avg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-panel">
          <h3>Recent Searches</h3>
          {stats.recent_searches.length === 0 ? (
            <p className="panel-empty">No searches yet.</p>
          ) : (
            <ul className="panel-list">
              {stats.recent_searches.map((s, i) => (
                <li key={i}>
                  <span>"{s.query}"</span>
                  <span className="panel-metric">
                    {s.results_count} results
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-panel">
          <h3>Recent Admin Activity</h3>
          {stats.recent_audit_log.length === 0 ? (
            <p className="panel-empty">No activity logged yet.</p>
          ) : (
            <ul className="panel-list">
              {stats.recent_audit_log.map((log, i) => (
                <li key={i}>
                  <span>{log.details}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}