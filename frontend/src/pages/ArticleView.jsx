import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./ArticleView.css";

export default function ArticleView() {
  const { slug } = useParams();
  const { user } = useAuth();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

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
        <h1>{article.title}</h1>
        <div className="article-meta">Status: {article.status}</div>
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