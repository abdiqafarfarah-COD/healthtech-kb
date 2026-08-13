import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Home.css";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    setLoading(true);
    try {
      const response = await api.get("/articles");
      setArticles(response.data);
    } catch (err) {
      console.error("Failed to load articles", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) {
      setSearched(false);
      loadArticles();
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const response = await api.get("/search", { params: { q: query } });
      setArticles(response.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="home-header">
        <h1>Healthtech Knowledge Base</h1>
        <p>Search troubleshooting articles and documentation</p>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <div className="empty-state">Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          {searched
            ? "No articles matched your search."
            : "No published articles yet."}
        </div>
      ) : (
        <div className="article-list">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.slug}`}
              className="article-card"
            >
              <h3>{article.title}</h3>
              <p>{article.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}