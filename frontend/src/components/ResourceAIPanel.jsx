import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineSparkles,
  HiOutlineDocumentText,
  HiOutlineQuestionMarkCircle,
  HiOutlineRectangleStack,
  HiOutlineChatBubbleLeftEllipsis,
} from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth.js";
import {
  getResourceSummary,
  getResourceQuiz,
  getResourceFlashcards,
  chatWithResource,
} from "../services/aiService.js";
import "../styles/ResourceAIPanel.css";

const TABS = [
  { key: "summary", label: "Summary", icon: HiOutlineDocumentText },
  { key: "quiz", label: "Quiz", icon: HiOutlineQuestionMarkCircle },
  { key: "flashcards", label: "Flashcards", icon: HiOutlineRectangleStack },
  { key: "chat", label: "Chat", icon: HiOutlineChatBubbleLeftEllipsis },
];

function SummaryTab({ resourceId }) {
  const [state, setState] = useState({ loading: false, error: "", summary: null });

  const load = async () => {
    setState({ loading: true, error: "", summary: null });
    try {
      const data = await getResourceSummary(resourceId);
      setState({ loading: false, error: "", summary: data.summary });
    } catch (err) {
      setState({ loading: false, error: err.message || "Could not generate summary", summary: null });
    }
  };

  if (!state.summary && !state.loading && !state.error) {
    return (
      <div className="ai-tab-empty">
        <p>Get a quick AI-generated summary of this resource's key concepts.</p>
        <button className="ai-action-btn" onClick={load}>
          <HiOutlineSparkles /> Generate Summary
        </button>
      </div>
    );
  }

  if (state.loading) return <p className="ai-tab-status">Reading the resource...</p>;
  if (state.error) return <p className="ai-tab-status ai-tab-error">{state.error}</p>;

  return (
    <div className="ai-summary-content">
      {state.summary
        .split("\n")
        .filter((line) => line.trim())
        .map((line, i) => (
          <p key={i}>{line.replace(/^-\s*/, "")}</p>
        ))}
    </div>
  );
}

function QuizTab({ resourceId }) {
  const [state, setState] = useState({ loading: false, error: "", questions: null });
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  const load = async () => {
    setState({ loading: true, error: "", questions: null });
    try {
      const data = await getResourceQuiz(resourceId, 5);
      setState({ loading: false, error: "", questions: data.questions });
      setIndex(0);
      setSelected(null);
      setScore(0);
    } catch (err) {
      setState({ loading: false, error: err.message || "Could not generate quiz", questions: null });
    }
  };

  const selectOption = (optionIndex) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    if (optionIndex === state.questions[index].correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const next = () => {
    setSelected(null);
    setIndex((i) => i + 1);
  };

  if (!state.questions && !state.loading && !state.error) {
    return (
      <div className="ai-tab-empty">
        <p>Test your understanding with an AI-generated 5-question quiz.</p>
        <button className="ai-action-btn" onClick={load}>
          <HiOutlineSparkles /> Generate Quiz
        </button>
      </div>
    );
  }

  if (state.loading) return <p className="ai-tab-status">Writing quiz questions...</p>;
  if (state.error) return <p className="ai-tab-status ai-tab-error">{state.error}</p>;

  if (index >= state.questions.length) {
    return (
      <div className="ai-tab-empty">
        <p className="ai-quiz-score">
          You scored {score} / {state.questions.length}
        </p>
        <button className="ai-action-btn" onClick={load}>
          <HiOutlineSparkles /> Try a New Quiz
        </button>
      </div>
    );
  }

  const q = state.questions[index];

  return (
    <div className="ai-quiz-content">
      <p className="ai-quiz-progress">
        Question {index + 1} of {state.questions.length}
      </p>
      <h4 className="ai-quiz-question">{q.question}</h4>
      <div className="ai-quiz-options">
        {q.options.map((option, i) => {
          let cls = "ai-quiz-option";
          if (selected !== null) {
            if (i === q.correctIndex) cls += " correct";
            else if (i === selected) cls += " incorrect";
          }
          return (
            <button key={i} className={cls} onClick={() => selectOption(i)} disabled={selected !== null}>
              {option}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="ai-quiz-explanation">
          <p>{q.explanation}</p>
          <button className="ai-action-btn" onClick={next}>
            {index + 1 < state.questions.length ? "Next Question" : "See Score"}
          </button>
        </div>
      )}
    </div>
  );
}

function FlashcardsTab({ resourceId }) {
  const [state, setState] = useState({ loading: false, error: "", flashcards: null });
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const load = async () => {
    setState({ loading: true, error: "", flashcards: null });
    try {
      const data = await getResourceFlashcards(resourceId, 8);
      setState({ loading: false, error: "", flashcards: data.flashcards });
      setIndex(0);
      setFlipped(false);
    } catch (err) {
      setState({ loading: false, error: err.message || "Could not generate flashcards", flashcards: null });
    }
  };

  if (!state.flashcards && !state.loading && !state.error) {
    return (
      <div className="ai-tab-empty">
        <p>Generate a set of flashcards to help you memorize key terms.</p>
        <button className="ai-action-btn" onClick={load}>
          <HiOutlineSparkles /> Generate Flashcards
        </button>
      </div>
    );
  }

  if (state.loading) return <p className="ai-tab-status">Building flashcards...</p>;
  if (state.error) return <p className="ai-tab-status ai-tab-error">{state.error}</p>;

  const card = state.flashcards[index];

  return (
    <div className="ai-flashcards-content">
      <p className="ai-quiz-progress">
        Card {index + 1} of {state.flashcards.length}
      </p>
      <button className={`ai-flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((f) => !f)}>
        <span className="ai-flashcard-label">{flipped ? "Back" : "Front"} (tap to flip)</span>
        <p>{flipped ? card.back : card.front}</p>
      </button>
      <div className="ai-flashcard-nav">
        <button
          className="ai-action-btn secondary"
          disabled={index === 0}
          onClick={() => {
            setIndex((i) => i - 1);
            setFlipped(false);
          }}
        >
          Previous
        </button>
        <button
          className="ai-action-btn secondary"
          disabled={index >= state.flashcards.length - 1}
          onClick={() => {
            setIndex((i) => i + 1);
            setFlipped(false);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ChatTab({ resourceId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const { reply } = await chatWithResource(resourceId, text, history);
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: err.message || "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-content">
      <div className="ai-chat-log">
        {messages.length === 0 && (
          <p className="ai-tab-status">Ask a question about this resource - answers are grounded in its content.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ai-chat-bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="ai-chat-bubble model ai-chat-thinking">Thinking...</div>}
      </div>
      <form className="ai-chat-form" onSubmit={send}>
        <input
          type="text"
          placeholder="Ask a question about this resource..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

function ResourceAIPanel({ resourceId }) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <section className="ai-panel">
      <h2>
        <HiOutlineSparkles /> AI Study Tools
      </h2>

      {!isAuthenticated ? (
        <p className="comment-login-hint">
          <Link to="/login">Log in</Link> to summarize, quiz yourself, make flashcards, or chat about this resource.
        </p>
      ) : (
        <>
          <div className="ai-panel-tabs">
            {/* eslint-disable-next-line no-unused-vars -- Icon is used as the JSX tag below; core no-unused-vars doesn't resolve destructured-and-renamed JSX component names */}
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`ai-panel-tab ${activeTab === key ? "active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>

          <div className="ai-panel-body">
            {activeTab === "summary" && <SummaryTab resourceId={resourceId} />}
            {activeTab === "quiz" && <QuizTab resourceId={resourceId} />}
            {activeTab === "flashcards" && <FlashcardsTab resourceId={resourceId} />}
            {activeTab === "chat" && <ChatTab resourceId={resourceId} />}
          </div>
        </>
      )}
    </section>
  );
}

export default ResourceAIPanel;
