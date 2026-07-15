import "../styles/Homepage.css";
import homelogo from "../assets/home.jpg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineRocketLaunch,
  HiOutlineSparkles,
  HiOutlineBookOpen,
  HiOutlineBolt,
  HiOutlineLockClosed,
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
  HiOutlineUsers,
} from "react-icons/hi2";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function HomePage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: HiOutlineBookOpen,
      title: "Centralized Resources",
      desc: "Access notes, PDFs, and materials in one organized place.",
      colorClass: "color-1",
    },
    {
      icon: HiOutlineBolt,
      title: "Fast & Easy",
      desc: "Simple interface designed specifically for students' workflow.",
      colorClass: "color-2",
    },
    {
      icon: HiOutlineLockClosed,
      title: "Secure System",
      desc: "Safe login and protected content with encrypted storage.",
      colorClass: "color-3",
    },
    {
      icon: HiOutlineUserGroup,
      title: "Collaborative",
      desc: "Share and collaborate with peers in real-time.",
      colorClass: "color-4",
    },
  ];

  return (
    <div className="home">

      {/* HERO SECTION */}
      <section className="hero">
        <motion.div
          className="hero-text"
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="tagline">
            <span className="tag">
              <HiOutlineRocketLaunch className="tag-icon" /> Future Ready
            </span>
            <span className="tag">
              <HiOutlineSparkles className="tag-icon" /> Smart Learning
            </span>
          </div>
          <h1>
            <span className="gradient-text">Smart Student</span>
            <br />
            Resource System
          </h1>
          <p className="hero-description">
            A centralized platform designed to help students <span className="highlight">learn, share,</span>
            and <span className="highlight">grow together</span> with smart digital resources.
          </p>
          <div className="hero-buttons">
            <button className="hero-btn primary" onClick={() => navigate("/login")}>
              <span>Get Started Free</span>
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"/>
              </svg>
            </button>
            <button className="hero-btn secondary" onClick={() => navigate("/resources")}>
              <svg className="play-icon" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Browse Resources
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <h4>10K+</h4>
              <p>Active Students</p>
            </div>
            <div className="stat-item">
              <h4>2.5K+</h4>
              <p>Resources</p>
            </div>
            <div className="stat-item">
              <h4>4.9</h4>
              <p>Rating</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hero-image"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        >
          <div className="image-container">
            <img
              src={homelogo}
              alt="Smart Student Platform"
              className="main-image"
            />
            <div className="image-overlay"></div>

            {/* Floating Cards around image */}
            <div className="floating-card card-1">
              <div className="card-icon"><HiOutlineBookOpen /></div>
              <p>Study Materials</p>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon"><HiOutlineCalendarDays /></div>
              <p>Schedule</p>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon"><HiOutlineUsers /></div>
              <p>Collaborate</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-subtitle">Why Choose Us</span>
          <h2>Transform Your Learning Experience</h2>
          <p className="section-description">
            Discover features designed to make your academic journey smoother and more productive
          </p>
        </motion.div>

        <div className="feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className={`feature-card ${feature.colorClass} ${activeFeature === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
                onClick={() => setActiveFeature(index)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className="feature-icon"><Icon /></div>
                <div className="feature-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                  <div className="feature-hover">
                    <span className="learn-more">Learn more →</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Details */}
        <div className="feature-detail">
          <div className="detail-content">
            <h3>{features[activeFeature].title}</h3>
            <p>Detailed description about {features[activeFeature].title.toLowerCase()} feature...</p>
            <ul className="detail-list">
              <li>✓ Advanced search functionality</li>
              <li>✓ Real-time updates</li>
              <li>✓ Mobile responsive design</li>
            </ul>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials">
        <div className="section-header">
          <h2>What Students Say</h2>
          <p>Join thousands of successful students worldwide</p>
        </div>

        <div className="testimonial-cards">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"This platform revolutionized how I study. The resources are amazing!"</p>
              <div className="testimonial-author">
                <div className="author-avatar">AS</div>
                <div>
                  <h4>Alex Smith</h4>
                  <p>Computer Science Student</p>
                </div>
              </div>
            </div>
            <div className="rating">★★★★★</div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Collaborating with classmates has never been easier. Highly recommended!"</p>
              <div className="testimonial-author">
                <div className="author-avatar">MJ</div>
                <div>
                  <h4>Maria Johnson</h4>
                  <p>Engineering Student</p>
                </div>
              </div>
            </div>
            <div className="rating">★★★★★</div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Take the Next Step in Your Learning Journey</h2>
            <p>Start now or connect with our team for guidance, support, and onboarding help.</p>
            <div className="cta-buttons">
              <button
                className="cta-button primary"
                onClick={() => navigate("/login")}
              >
                Get Started Now →
              </button>
              <button
                className="cta-button secondary"
                onClick={() => navigate("/contact")}
              >
                Contact Our Team
              </button>
            </div>
            <p className="cta-note">Need help with resources or dashboard setup? Our team is ready to help.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
