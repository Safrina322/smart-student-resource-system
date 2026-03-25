import "../styles/AboutPage.css";
import aboutImage from "../assets/abouting.jpg"; // You'll need to add this image

function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1 className="about-title">Our Story & Vision</h1>
          <p className="about-subtitle">
            Empowering students worldwide with smart digital resources and collaborative learning
          </p>
          <div className="about-hero-stats">
            <div className="stat">
              <h3>10,000+</h3>
              <p>Active Students</p>
            </div>
            <div className="stat">
              <h3>2,500+</h3>
              <p>Resources Shared</p>
            </div>
            <div className="stat">
              <h3>50+</h3>
              <p>Universities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-content">
          <div className="mission-text">
            <h2>Our Mission</h2>
            <p>
              We believe that every student deserves access to quality educational resources. 
              Smart Student Resource System was founded to break down barriers in education 
              by creating a centralized platform where students can learn, share, and grow together.
            </p>
            <p>
              Our platform bridges the gap between traditional learning methods and modern 
              digital solutions, providing an intuitive space for collaboration and knowledge sharing.
            </p>
          </div>
          <div className="mission-image">
            <div className="image-frame">
              <img src={aboutImage} alt="Students collaborating" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <div className="section-header">
          <h2>Our Core Values</h2>
          <p>Principles that guide everything we do</p>
        </div>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">👥</div>
            <h3>Collaboration</h3>
            <p>We believe knowledge grows when shared. Our platform encourages students to work together and learn from each other.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🚀</div>
            <h3>Innovation</h3>
            <p>Constantly evolving to provide cutting-edge tools and features that enhance the learning experience.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🔓</div>
            <h3>Accessibility</h3>
            <p>Education should be accessible to all. We design with inclusivity and ease of use in mind.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">💡</div>
            <h3>Growth Mindset</h3>
            <p>We encourage continuous learning and personal development for students at every level.</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="section-header">
          <h2>Meet Our Team</h2>
          <p>The passionate people behind Smart Student</p>
        </div>
        <div className="team-grid">
          <div className="team-card">
            <div className="team-avatar">
              <div className="avatar-img">AS</div>
            </div>
            <h3>Alex Smith</h3>
            <p className="team-role">Founder & CEO</p>
            <p className="team-desc">Former educator with 10+ years in ed-tech innovation</p>
          </div>
          <div className="team-card">
            <div className="team-avatar">
              <div className="avatar-img">MJ</div>
            </div>
            <h3>Maria Johnson</h3>
            <p className="team-role">Lead Developer</p>
            <p className="team-desc">Passionate about creating seamless user experiences</p>
          </div>
          <div className="team-card">
            <div className="team-avatar">
              <div className="avatar-img">DW</div>
            </div>
            <h3>David Williams</h3>
            <p className="team-role">Product Designer</p>
            <p className="team-desc">Focuses on intuitive interfaces and student-centered design</p>
          </div>
          <div className="team-card">
            <div className="team-avatar">
              <div className="avatar-img">SC</div>
            </div>
            <h3>Sarah Chen</h3>
            <p className="team-role">Content Strategist</p>
            <p className="team-desc">Ensures quality educational resources and materials</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="cta-content">
          <h2>Join Our Learning Community</h2>
          <p>Become part of the revolution in digital education</p>
          <div className="cta-buttons">
            <button className="cta-btn primary">Get Started Now</button>
            <button className="cta-btn secondary">Contact Our Team</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;