import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./ArticleView.css";

export default function ArticleView() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  useEffect(() => {
    loadArticle();
  }, [slug]);

  async function loadArticle() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/articles/${slug}`);
      setArticle(response.data);
    } catch (err) {
      setError("Article not found.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    setFeedbackError("");

    if (rating < 1 || rating > 5) {
      setFeedbackError("Please select a rating from 1 to 5.");
      return;
    }

    try {
      await api.post("/feedback", {
        article_id: article.id,
        rating: rating,
        comment: comment || null,
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setFeedbackError(err.response.data.detail);
      } else {
        setFeedbackError("Failed to submit feedback.");
      }
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError("");
    try {
      const response = await api.post(`/articles/${article.id}/publish`);
      setArticle(response.data);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setPublishError(err.response.data.detail);
      } else {
        setPublishError("Failed to publish article.");
      }
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <div className="page-container">Loading article...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">{error}</div>
        <Link to="/">Back to homepage</Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to="/" className="back-link">
        ← Back to all articles
      </Link>

      <div className="article-full">
        <div className="article-title-row">
          <h1>{article.title}</h1>
          {user && user.role === "admin" && article.status === "draft" && (
            <button
              className="publish-button"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
        <div className="article-meta">Status: {article.status}</div>
        {publishError && <div className="auth-error">{publishError}</div>}
        <div className="article-content">{article.content}</div>
      </div>

      {user && (
        <div className="feedback-box">
          <h3>Was this article helpful?</h3>

          {feedbackSubmitted ? (
            <p className="feedback-thanks">Thank you for your feedback.</p>
          ) : (
            <form onSubmit={handleFeedbackSubmit}>
              {feedbackError && (
                <div className="auth-error">{feedbackError}</div>
              )}

              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className={rating >= star ? "star selected" : "star"}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Optional comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />

              <button type="submit" className="feedback-submit">
                Submit Feedback
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}