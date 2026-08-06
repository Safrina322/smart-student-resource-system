import "../styles/Homepage.css";
import heroImage from "../assets/home1.jpeg";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars -- used as <motion.div>; the JSX-member-expression form isn't resolved as a usage by no-unused-vars
import { motion } from "framer-motion";
import {
  HiOutlineBookOpen,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineCloudArrowUp,
  HiOutlineBellAlert,
  HiOutlineArrowRight,
} from "react-icons/hi2";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const HIGHLIGHTS = [
  { value: "AI-Powered", label: "Study assistant, quizzes & flashcards" },
  { value: "Real-Time", label: "Notifications on every update" },
  { value: "Cloud-Synced", label: "Access your resources anywhere" },
];

const FEATURES = [
  {
    icon: HiOutlineBookOpen,
    title: "Centralized Resources",
    desc: "Every note, PDF, and course material organized in one searchable place.",
  },
  {
    icon: HiOutlineSparkles,
    title: "AI Study Tools",
    desc: "Summaries, quizzes, and flashcards generated from your own resources.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Secure by Design",
    desc: "httpOnly sessions, account lockout, and encrypted credentials throughout.",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Built for Collaboration",
    desc: "Comments, ratings, and shared bookmarks keep everyone in sync.",
  },
];

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* HERO SECTION */}
      <section className="hero">
        <motion.div
          className="hero-text"
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="hero-kicker">Smart Student Platform</span>
          <h1>
            Your academic resources,
            <br />
            organized and intelligent.
          </h1>
          <p className="hero-description">
            A centralized platform where students discover, share, and study smarter with
            AI-assisted tools built for the way modern coursework actually works.
          </p>
          <div className="hero-buttons">
            <button className="hero-btn primary" onClick={() => navigate("/login")}>
              Get Started
              <HiOutlineArrowRight />
            </button>
            <button className="hero-btn secondary" onClick={() => navigate("/resources")}>
              Browse Resources
            </button>
          </div>

          <div className="hero-highlights">
            {HIGHLIGHTS.map((item) => (
              <div className="highlight-item" key={item.value}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="hero-image"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        >
          <img src={heroImage} alt="Student studying with a laptop" className="main-image" />
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4 }}
        >
          <span className="section-subtitle">Why SmartStudent</span>
          <h2>Everything you need, nothing you don&apos;t</h2>
          <p className="section-description">
            Purpose-built tools for organizing coursework and studying more effectively.
          </p>
        </motion.div>

        <div className="feature-grid">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="feature-card"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
              >
                <div className="feature-icon">
                  <Icon />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* AI SECTION */}
      <section className="ai-highlight">
        <div className="ai-highlight-content">
          <span className="section-subtitle">AI-Powered Learning</span>
          <h2>Study smarter, not longer</h2>
          <p>
            Pick any resource and generate a summary, a practice quiz, or a set of flashcards in
            seconds - or chat directly with the material when you get stuck.
          </p>
          <button className="hero-btn primary" onClick={() => navigate("/login")}>
            Try AI Tools
            <HiOutlineArrowRight />
          </button>
        </div>
        <div className="ai-highlight-grid">
          <div className="ai-highlight-card">
            <HiOutlineSparkles />
            <span>Study Assistant</span>
          </div>
          <div className="ai-highlight-card">
            <HiOutlineBookOpen />
            <span>Quiz Generator</span>
          </div>
          <div className="ai-highlight-card">
            <HiOutlineCloudArrowUp />
            <span>Resource Summarizer</span>
          </div>
          <div className="ai-highlight-card">
            <HiOutlineBellAlert />
            <span>Flashcards</span>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to get organized?</h2>
          <p>Create an account and bring your coursework into one place.</p>
          <div className="cta-buttons">
            <button className="cta-button primary" onClick={() => navigate("/login")}>
              Get Started
            </button>
            <button className="cta-button secondary" onClick={() => navigate("/contact")}>
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
