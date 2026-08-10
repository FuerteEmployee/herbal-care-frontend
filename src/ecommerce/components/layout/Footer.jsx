import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/img/logo.png';

const QUICK_LINKS_BASE = [
  { to: '/', label: 'Home' },
  { to: '/kings-man', label: "Herbal King's Man" },
  { to: '/about', label: 'About Us' },
];

const BLOG_QUICK_LINK = { to: '/blog', label: 'Blog' };
const CONTACT_QUICK_LINK = { to: '/contact', label: 'Contact Us' };

const QUICK_LINKS_LAST = {
  full: { to: '/#inquiry', label: 'Enquiry' },
  blog: { to: '/#inquiry', label: 'Enquiry' },
  checkout: { to: '/account', label: 'My Account' },
  account: { to: '/checkout', label: 'Book Now' },
};

const INFO_LINKS = [
  { to: '/#ingredients', label: 'Ingredients' },
  { to: '/kings-man#usage', label: 'How to Use' },
  { to: '/kings-man#faq', label: 'FAQs' },
  { to: '/#reviews', label: 'Reviews' },
  { to: '/contact', label: 'Shipping & COD' },
];

const ACCOUNT_LINKS = [
  { to: '/account', label: 'Order History' },
  { to: '/account', label: 'Track Order' },
  { to: '/account', label: 'My Reviews' },
  { to: '/account', label: 'Addresses' },
  { to: '/account', label: 'Profile' },
];

const currentYear = new Date().getFullYear();

export default function Footer({ variant = 'full' }) {
  const quickLinks = variant === 'blog' ? [...QUICK_LINKS_BASE, BLOG_QUICK_LINK, CONTACT_QUICK_LINK] : [...QUICK_LINKS_BASE, CONTACT_QUICK_LINK];
  const quickLinksLast = QUICK_LINKS_LAST[variant];

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div>
            <Link className="brand" to="/">
              <img src={logoImg} alt="Herbal King's Man" className="brand__logo" />
            </Link>
            <p style={{ marginTop: 18 }}>
              Premium Ayurvedic wellness products made in India, blending classical herbal traditions with modern
              quality standards.
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <nav className="flinks">
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to}>
                  {link.label}
                </Link>
              ))}
              <Link to={quickLinksLast.to}>{quickLinksLast.label}</Link>
            </nav>
          </div>

          <div>
            <h4>Certified Quality</h4>
            <div className="certs">
              <span>ISI Certified</span>
              <span>FSSAI</span>
              <span>GMP</span>
              <span>100% Natural</span>
            </div>
          </div>

          <div>
            <h4>Get in Touch</h4>
            <ul className="fcontact">
              <li>
                <svg viewBox="0 0 24 24">
                  <path d="M4 5.5C4 4.7 4.7 4 5.5 4h2.2c.7 0 1.3.5 1.5 1.2l.7 3c.1.6-.1 1.2-.6 1.5l-1.4 1a11 11 0 004.4 4.4l1-1.4c.4-.5 1-.7 1.5-.6l3 .7c.7.2 1.2.8 1.2 1.5v2.2c0 .8-.7 1.5-1.5 1.5A15.5 15.5 0 014 5.5z" />
                </svg>
                <a className="allow-select" href="tel:+918469057530">+91 84690 57530</a>
              </li>
              <li>
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3.5 6.5L12 12.5l8.5-6" />
                </svg>
                <a className="allow-select" href="mailto:info@herbalgujratcare.com">info@herbalgujratcare.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bar">
          <span>
            © <span>{currentYear}</span> Herbal Gujarat. All rights reserved.
          </span>
          <span>
            <Link to="/privacy-policy">Privacy Policy</Link> ·{' '}
            <Link to="/terms-and-conditions">Terms &amp; Conditions</Link> ·{' '}
            <Link to="/shipping-policy">Shipping Policy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
