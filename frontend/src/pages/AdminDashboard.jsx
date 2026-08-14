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
    <div className="admin-layout">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of knowledge base activity, productivity, and audits</p>
      </div>

      <div className="admin-grid">
        <aside className="admin-col admin-left">
          <div className="admin-panel">
            <h3>Content</h3>
            <div className="admin-mini-stats">
              <div className="admin-mini-stat">
                <span className="admin-mini-stat-value">{stats.total_articles}</span>
                <span className="admin-mini-stat-label">Total</span>
              </div>
              <div className="admin-mini-stat">
                <span className="admin-mini-stat-value">{stats.published_articles}</span>
                <span className="admin-mini-stat-label">Published</span>
              </div>
              <div className="admin-mini-stat">
                <span className="admin-mini-stat-value">{stats.draft_articles}</span>
                <span className="admin-mini-stat-label">Drafts</span>
              </div>
              <div className="admin-mini-stat">
                <span className="admin-mini-stat-value">{stats.total_categories}</span>
                <span className="admin-mini-stat-label">Categories</span>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <h3>Users by Role</h3>
            <div className="admin-role-list">
              {Object.entries(stats.users_by_role).map(([role, count]) => (
                <div key={role} className="admin-role-row">
                  <span className="admin-role-name">{role}</span>
                  <span className="admin-role-count">{count}</span>
                </div>
              ))}
              <div className="admin-role-row admin-role-total">
                <span className="admin-role-name">Total</span>
                <span className="admin-role-count">{stats.total_users}</span>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <h3>Chatbot Activity</h3>
            <div className="admin-mini-stats">
              <div className="admin-mini-stat">
                <span className="admin-mini-stat-value">{stats.total_chats}</span>
                <span className="admin-mini-stat-label">Conversations</span>
              </div>
              <div className="admin-mini-stat">
                <span className="admin-mini-stat-value">{stats.unanswered_chats}</span>
                <span className="admin-mini-stat-label">Unanswered</span>
              </div>
            </div>
            <div className="admin-answer-rate">
              <span>Answer Rate</span>
              <span className="admin-answer-rate-value">
                {stats.total_chats > 0
                  ? Math.round(
                      ((stats.total_chats - stats.unanswered_chats) / stats.total_chats) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </aside>

        <main className="admin-col admin-center">
          <div className="admin-panel">
            <h3>Productivity: Articles by Author</h3>
            {stats.articles_by_author.length === 0 ? (
              <p className="admin-panel-empty">No authored articles yet.</p>
            ) : (
              <div className="admin-author-bars">
                {stats.articles_by_author.map((a) => {
                  const max = Math.max(...stats.articles_by_author.map((x) => x.count), 1);
                  const pct = (a.count / max) * 100;
                  return (
                    <div key={a.name} className="admin-author-row">
                      <span className="admin-author-name">{a.name}</span>
                      <div className="admin-author-track">
                        <div className="admin-author-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="admin-author-count">{a.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="admin-panel">
            <h3>Drafts Awaiting Publish</h3>
            {stats.pending_drafts.length === 0 ? (
              <p className="admin-panel-empty">No drafts pending review.</p>
            ) : (
              <ul className="admin-panel-list">
                {stats.pending_drafts.map((d) => (
                  <li key={d.id}>
                    <span>{d.title}</span>
                    <span className="admin-panel-metric">by {d.author}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-panel">
            <h3>Top Articles by Views</h3>
            {stats.top_articles.length === 0 ? (
              <p className="admin-panel-empty">No view data yet.</p>
            ) : (
              <ul className="admin-panel-list">
                {stats.top_articles.map((a) => (
                  <li key={a.id}>
                    <span>{a.title}</span>
                    <span className="admin-panel-metric">{a.views} views</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-panel">
            <h3>Low-Rated Articles</h3>
            {stats.low_rated_articles.length === 0 ? (
              <p className="admin-panel-empty">No low-rated articles.</p>
            ) : (
              <ul className="admin-panel-list">
                {stats.low_rated_articles.map((a) => (
                  <li key={a.id}>
                    <span>{a.title}</span>
                    <span className="admin-panel-metric admin-panel-warning">
                      {a.avg_rating.toFixed(1)} avg
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>

        <aside className="admin-col admin-right">
          <div className="admin-panel">
            <h3>Recent Searches</h3>
            {stats.recent_searches.length === 0 ? (
              <p className="admin-panel-empty">No searches yet.</p>
            ) : (
              <ul className="admin-panel-list">
                {stats.recent_searches.map((s, i) => (
                  <li key={i}>
                    <span>"{s.query}"</span>
                    <span className="admin-panel-metric">{s.results_count} results</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-panel">
            <h3>Recent Admin Activity</h3>
            {stats.recent_audit_log.length === 0 ? (
              <p className="admin-panel-empty">No activity logged yet.</p>
            ) : (
              <ul className="admin-panel-list">
                {stats.recent_audit_log.map((log, i) => (
                  <li key={i}>
                    <span>{log.details}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}