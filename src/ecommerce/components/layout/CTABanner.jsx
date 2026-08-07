import React from 'react';
import { Link } from 'react-router-dom';

export default function CTABanner({ eyebrow, heading, text, buttons }) {
  return (
    <section className="cta">
      <div className="cta__in wrap">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{heading}</h2>
        <p>{text}</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 26 }}>
          {buttons.map((button) =>
            button.external ? (
              <a
                key={button.label}
                href={button.to}
                target="_blank"
                rel="noopener"
                className={`btn ${button.variant || 'btn--gold'} btn--lg`}
              >
                {button.label}
              </a>
            ) : (
              <Link key={button.label} to={button.to} className={`btn ${button.variant || 'btn--gold'} btn--lg`}>
                {button.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
