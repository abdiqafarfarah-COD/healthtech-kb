import { useState, useEffect } from "react";
import api from "../services/api";
import "./CategoryManager.css";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (err) {
      setLoadError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const response = await api.post("/categories", {
        name,
        description: description || null,
        parent_id: parentId ? parseInt(parentId) : null,
      });

      setMessage(`Category created: "${response.data.name}"`);
      setName("");
      setDescription("");
      setParentId("");
      loadCategories();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create category.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container category-page">
      <div className="category-header">
        <h1>Category Manager</h1>
        <p>Create and view knowledge base categories</p>
      </div>

      {message && <div className="auth-success">{message}</div>}
      {error && <div className="auth-error">{error}</div>}

      <form className="category-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Category Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="parent">Parent Category (optional)</label>
          <select
            id="parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">No parent (top-level category)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Category"}
        </button>
      </form>

      <div className="category-list-section">
        <h2>Existing Categories</h2>

        {loading ? (
          <p className="category-panel-empty">Loading categories...</p>
        ) : loadError ? (
          <p className="category-panel-empty">{loadError}</p>
        ) : categories.length === 0 ? (
          <p className="category-panel-empty">No categories created yet.</p>
        ) : (
          <div className="category-list">
            {categories.map((cat) => (
              <div key={cat.id} className="category-card">
                <div className="category-card-name">{cat.name}</div>
                {cat.description && (
                  <div className="category-card-desc">{cat.description}</div>
                )}
                <div className="category-card-count">
                  {cat.article_count} article
                  {cat.article_count === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}