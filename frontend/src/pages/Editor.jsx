import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Editor.css";

export default function Editor() {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productVersion, setProductVersion] = useState("");
  const [categories, setCategories] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [myDrafts, setMyDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadMyDrafts();
  }, []);

  async function loadCategories() {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  }

  async function loadMyDrafts() {
    setDraftsLoading(true);
    try {
      if (user && user.role === "admin") {
        const response = await api.get("/admin/dashboard");
        setMyDrafts(response.data.pending_drafts);
      } else {
        setMyDrafts([]);
      }
    } catch (err) {
      console.error("Failed to load drafts", err);
    } finally {
      setDraftsLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/articles", {
        title,
        content,
        category_id: categoryId ? parseInt(categoryId) : null,
        product_version: productVersion || null,
      });

      setMessage(`Draft created: "${response.data.title}"`);
      setTitle("");
      setContent("");
      setCategoryId("");
      setProductVersion("");
      loadMyDrafts();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create article.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="editor-layout">
      <div className="editor-header">
        <h1>Editor Workspace</h1>
        <p>Create a new knowledge base article (saved as draft)</p>
      </div>

      <div className="editor-grid">
        <div className="editor-main">
          {message && <div className="auth-success">{message}</div>}
          {error && <div className="auth-error">{error}</div>}

          <form className="editor-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                required
              />
            </div>

            <div className="editor-form-row">
              <div className="form-group">
                <label htmlFor="category">Category (optional)</label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="productVersion">Product Version (optional)</label>
                <input
                  id="productVersion"
                  type="text"
                  placeholder="e.g. v2.3"
                  value={productVersion}
                  onChange={(e) => setProductVersion(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save as Draft"}
            </button>
          </form>
        </div>

        <aside className="editor-side">
          <div className="editor-panel">
            <h3>Categories at a Glance</h3>
            {categories.length === 0 ? (
              <p className="editor-panel-empty">No categories yet.</p>
            ) : (
              <ul className="editor-category-list">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <span>{cat.name}</span>
                    <span className="editor-panel-metric">{cat.article_count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {user && user.role === "admin" && (
            <div className="editor-panel">
              <h3>Drafts Awaiting Publish</h3>
              {draftsLoading ? (
                <p className="editor-panel-empty">Loading...</p>
              ) : myDrafts.length === 0 ? (
                <p className="editor-panel-empty">No drafts pending review.</p>
              ) : (
                <ul className="editor-panel-list">
                  {myDrafts.map((d) => (
                    <li key={d.id}>
                      <span>{d.title}</span>
                      <span className="editor-panel-metric">by {d.author}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}