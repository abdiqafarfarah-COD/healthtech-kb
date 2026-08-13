import React, { useState, useRef, useEffect } from "react";
import api from "../services/api";
import "./ChatWidget.css";

function generateSessionId() {
  return "session-" + Math.random().toString(36).substring(2, 15);
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello. Ask me a question about the knowledge base and I will try to find a relevant article.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(generateSessionId);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSend(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || sending) return;

    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setInput("");
    setSending(true);

    try {
      const response = await api.post("/chat", {
        question,
        session_id: sessionId,
      });

      const { answer, cited_article_title, cited_article_slug } =
        response.data;

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: answer,
          articleTitle: cited_article_title,
          articleSlug: cited_article_slug,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, something went wrong reaching the knowledge base. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function renderCitation(msg) {
    if (!msg.articleSlug) {
      return null;
    }
    const citationUrl = "/articles/" + msg.articleSlug;
    return React.createElement(
      "a",
      { href: citationUrl, className: "chat-citation", target: "_blank", rel: "noopener noreferrer" },
      "View source: " + msg.articleTitle
    );
  }

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>KB Assistant</span>
            <button
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              Close
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={
                  msg.sender === "user" ? "chat-bubble user" : "chat-bubble bot"
                }
              >
                <div>{msg.text}</div>
                {renderCitation(msg)}
              </div>
            ))}
            {sending && (
              <div className="chat-bubble bot chat-typing">Thinking...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button
        className="chat-toggle-button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Toggle chat"
      >
        {isOpen ? "Close" : "Chat"}
      </button>
    </div>
  );
}
