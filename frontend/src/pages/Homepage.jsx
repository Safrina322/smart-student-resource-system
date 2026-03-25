import "../styles/Homepage.css";
import homelogo from "../assets/home.jpg";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  
  const features = [
    { 
      icon: "📚", 
      title: "Centralized Resources", 
      desc: "Access notes, PDFs, and materials in one organized place.", 
      colorClass: "color-1" 
    },
    { 
      icon: "⚡", 
      title: "Fast & Easy", 
      desc: "Simple interface designed specifically for students' workflow.", 
      colorClass: "color-2" 
    },
    { 
      icon: "🔒", 
      title: "Secure System", 
      desc: "Safe login and protected content with encrypted storage.", 
      colorClass: "color-3" 
    },
    { 
      icon: "🤝", 
      title: "Collaborative", 
      desc: "Share and collaborate with peers in real-time.", 
      colorClass: "color-4" 
    },
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="home">
      
      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-text">
          <div className="tagline">
            <span className="tag">🚀 Future Ready</span>
            <span className="tag">✨ Smart Learning</span>
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
        </div>

        <div className="hero-image">
          <div className="image-container">
            <img 
              src={homelogo} 
              alt="Smart Student Platform" 
              className="main-image"
            />
            <div className="image-overlay"></div>
            
            {/* Floating Cards around image */}
            <div className="floating-card card-1">
              <div className="card-icon">📚</div>
              <p>Study Materials</p>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">📅</div>
              <p>Schedule</p>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">👥</div>
              <p>Collaborate</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features">
        <div className="section-header">
          <span className="section-subtitle">Why Choose Us</span>
          <h2>Transform Your Learning Experience</h2>
          <p className="section-description">
            Discover features designed to make your academic journey smoother and more productive
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`feature-card ${feature.colorClass} ${activeFeature === index ? 'active' : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
              onClick={() => setActiveFeature(index)}
            >
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-content">
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <div className="feature-hover">
                  <span className="learn-more">Learn more →</span>
                </div>
              </div>
            </div>
          ))}
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
                onClick={() => window.location.href = "mailto:support@smartstudent.com?subject=SmartStudent%20Support"}
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