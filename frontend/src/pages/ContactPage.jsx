import "../styles/ContactPage.css";

function ContactPage() {
  const teamContacts = [
    {
      role: "Support Team",
      email: "support@smartstudent.com",
      note: "General support, account issues, and platform help",
    },
    {
      role: "Admin Team",
      email: "fathimasafrina57@gmail.com",
      note: "Course approvals, request review, and admin communication",
    },
  ];

  const whatsappNumber = "+91 90000 00000";
  const whatsappLink = "https://wa.me/919000000000";

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <p className="contact-kicker">Contact</p>
        <h1>Contact Our Team</h1>
        <p>
          Need help with requests, resources, login issues, or dashboard features?
          Reach our team through email or WhatsApp.
        </p>
      </section>

      <section className="contact-grid">
        {teamContacts.map((item) => (
          <article key={item.role} className="contact-card">
            <h3>{item.role}</h3>
            <a href={`mailto:${item.email}`} className="contact-link">
              {item.email}
            </a>
            <p>{item.note}</p>
          </article>
        ))}

        <article className="contact-card whatsapp-card">
          <h3>WhatsApp</h3>
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="contact-link">
            {whatsappNumber}
          </a>
          <p>Quick chat support for urgent student issues.</p>
        </article>
      </section>

      <p className="contact-footnote">
        Tip: Replace the WhatsApp number in Contact page with your real team number when ready.
      </p>
    </div>
  );
}

export default ContactPage;
