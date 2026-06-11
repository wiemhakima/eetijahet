import React, { useState } from 'react';
import Header from '../Home/components/Header';
import Footer from '../Home/components/Footer';
import './Support.scss';

const FAQS = [
  {
    q: 'How do I get my API key?',
    a: 'After signing up and verifying your email, go to the API Keys section in your developer dashboard and click "Create New API Key". Your key will be displayed once — store it securely.',
  },
  {
    q: 'What happens when I run out of credits?',
    a: 'Requests will return a 402 Payment Required error until your credits are replenished at the start of the next billing cycle, or you upgrade your plan.',
  },
  {
    q: 'Is there a free tier?',
    a: 'Yes. The Starter plan includes 500 credits per month at no cost. No credit card required.',
  },
  {
    q: 'Which countries are supported?',
    a: 'We currently have optimized road-network coverage for Kuwait. MENA expansion (UAE, Saudi Arabia, Jordan, Egypt) is in progress for Q3 2025.',
  },
  {
    q: 'What is the rate limit?',
    a: 'Rate limits depend on your plan: Starter 100 req/min, Growth 500 req/min, Pro 2,000 req/min. Enterprise plans have custom limits negotiated with our team.',
  },
  {
    q: 'How do I report a wrong ETA or distance result?',
    a: 'Use the contact form below and include the request body and response you received. Our data team reviews road-network anomalies within 48 hours.',
  },
];

type FormState = 'idle' | 'sending' | 'sent';

const Support: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formState, setFormState] = useState<FormState>('idle');
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('sending');
    setTimeout(() => setFormState('sent'), 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="support-page">
      <Header />

      <main>
        <section className="support-hero">
          <div className="support-container">
            <div className="support-hero__badge">Support</div>
            <h1 className="support-hero__title">How can we help?</h1>
            <p className="support-hero__subtitle">
              Browse the FAQ or send us a message and we'll get back to you within one business day.
            </p>
          </div>
        </section>

        <section className="support-body">
          <div className="support-container support-body__grid">

            {/* Contact form */}
            <div className="support-form-card">
              <h2 className="support-form-card__title">Send a message</h2>
              {formState === 'sent' ? (
                <div className="support-form-card__success">
                  <div className="support-form-card__success-icon">✓</div>
                  <h3>Message sent!</h3>
                  <p>We'll reply to your email within one business day.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="support-form">
                  <div className="support-form__group">
                    <label htmlFor="name">Full name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="support-form__group">
                    <label htmlFor="email">Email address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="support-form__group">
                    <label htmlFor="subject">Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a topic…</option>
                      <option value="api">API issue</option>
                      <option value="billing">Billing</option>
                      <option value="account">Account</option>
                      <option value="data">Data quality</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="support-form__group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Describe your issue in detail…"
                      value={form.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="support-form__submit"
                    disabled={formState === 'sending'}
                  >
                    {formState === 'sending' ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div className="support-faq">
              <h2 className="support-faq__title">Frequently asked questions</h2>
              <div className="support-faq__list">
                {FAQS.map((faq, i) => (
                  <div
                    key={i}
                    className={`support-faq__item ${openFaq === i ? 'support-faq__item--open' : ''}`}
                  >
                    <button
                      className="support-faq__question"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span>{faq.q}</span>
                      <span className="support-faq__chevron">
                        {openFaq === i ? '−' : '+'}
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="support-faq__answer">{faq.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
