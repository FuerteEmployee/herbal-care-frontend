import React, { useEffect, useRef } from 'react';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';

import PageHead from '../components/layout/PageHead.jsx';
import CTABanner from '../components/layout/CTABanner.jsx';
import EnquiryForm from '../components/EnquiryForm.jsx';
import { useRevealOnMount } from '../hooks/useRevealOnMount.js';

export default function Contact() {
  const pageRef = useRef(null);
  useRevealOnMount(pageRef);

  useEffect(() => {
    document.title = "Contact Us | Herbal Gujarat — Herbal King's Man Support";
  }, []);

  return (
    <main ref={pageRef}>
      <TopBar />
      <Header />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Contact Us' }]}
        title={
          <>
            We&apos;re Here to <span className="gold-text">Help</span>
          </>
        }
        subtitle="Questions about the formula, your order or a dealership enquiry — reach us whichever way suits you best."
      />

      <section className="section">
        <div className="wrap">
          <div className="contact-cards">
            <article className="ccard reveal">
              <div className="ccard__ic">
                <svg viewBox="0 0 24 24">
                  <path d="M4 5.5C4 4.7 4.7 4 5.5 4h2.2c.7 0 1.3.5 1.5 1.2l.7 3c.1.6-.1 1.2-.6 1.5l-1.4 1a11 11 0 004.4 4.4l1-1.4c.4-.5 1-.7 1.5-.6l3 .7c.7.2 1.2.8 1.2 1.5v2.2c0 .8-.7 1.5-1.5 1.5A15.5 15.5 0 014 5.5z" />
                </svg>
              </div>
              <h3>Call Us</h3>
              <p>
                <a href="tel:+918469057530">+91 84690 57530</a>
              </p>
            </article>

            <article className="ccard reveal">
              <div className="ccard__ic">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3.5 6.5L12 12.5l8.5-6" />
                </svg>
              </div>
              <h3>Email Us</h3>
              <p>
                <a href="mailto:info@herbalgujratcare.com">info@herbalgujratcare.com</a>
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--cream" id="form">
        <div className="wrap">
          <div className="inquiry__in">
            <div className="reveal">
              <span className="eyebrow">Enquiry Form</span>
              <h2>Send Us a Message</h2>
              <div className="rule" />
              <p>
                Fill in the form and our team will get back to you within one working day. For urgent order queries,
                calling is usually fastest.
              </p>

              <div style={{ marginTop: 28 }}>
                <a href="tel:+918469057530" className="btn btn--outline">
                  Call Now
                </a>
              </div>
            </div>

            <EnquiryForm source="Contact Page">
              <div className="form__row">
                <div className="field">
                  <label htmlFor="c-name">Full Name *</label>
                  <input type="text" id="c-name" name="name" placeholder="Your name" required />
                </div>
                <div className="field">
                  <label htmlFor="c-phone">Mobile Number *</label>
                  <input type="tel" id="c-phone" name="phone" placeholder="10-digit mobile" pattern="[0-9]{10}" maxLength={10} minLength={10} required />
                </div>
              </div>

              <div className="form__row">
                <div className="field">
                  <label htmlFor="c-email">Email</label>
                  <input type="email" id="c-email" name="email" placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label htmlFor="c-city">City</label>
                  <input type="text" id="c-city" name="city" placeholder="Your city" />
                </div>
              </div>

              <div className="field">
                <label htmlFor="c-subject">Subject</label>
                <select id="c-subject" name="subject">
                  <option>Product enquiry</option>
                  <option>Place an order</option>
                  <option>Track my order</option>
                  <option>Dosage &amp; usage guidance</option>
                  <option>Bulk order / dealership</option>
                  <option>Something else</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="c-msg">Message *</label>
                <textarea id="c-msg" name="message" placeholder="How can we help you?" required />
                <span className="field__hint">We never share your details with third parties.</span>
              </div>

              <button type="submit" className="btn btn--gold btn--block btn--lg">
                Send Message
              </button>
            </EnquiryForm>
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">Orders &amp; Delivery</span>
            <h2>Shipping, COD &amp; Returns</h2>
            <div className="rule" />
          </div>

          <div className="grid grid--3" style={{ marginTop: 44 }}>
            <article className="value reveal">
              <div className="value__ic">🚚</div>
              <h3>Free Shipping</h3>
              <p>Free delivery anywhere in India. Dispatch within 24–48 working hours; 3–5 days within Gujarat and 5–7 days elsewhere.</p>
            </article>
            <article className="value reveal">
              <div className="value__ic">💰</div>
              <h3>Cash on Delivery</h3>
              <p>Pay the courier when your pack arrives, at no extra charge. Online and UPI payment are also available if you prefer.</p>
            </article>
            <article className="value reveal">
              <div className="value__ic">📦</div>
              <h3>Damaged in Transit?</h3>
              <p>If a pack reaches you damaged or with a broken seal, call us within 48 hours with a photo and we will replace it.</p>
            </article>
          </div>
        </div>
      </section>

      <CTABanner
        eyebrow="Ready When You Are"
        heading="Order Herbal King's Man Today"
        text="Buy 1 Get 1 Free at ₹1,499 — with free shipping and cash on delivery across India."
        buttons={[
          { to: '/checkout?pack=combo', label: 'Book Now', variant: 'btn--gold' },
        ]}
      />

      <Footer variant="full" />
    </main>
  );
}
