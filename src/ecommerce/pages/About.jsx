import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';

import PageHead from '../components/layout/PageHead.jsx';
import CTABanner from '../components/layout/CTABanner.jsx';
import { useRevealOnMount } from '../hooks/useRevealOnMount.js';
import bottleImage from '../assets/img/bottle-front.png';
import awardImage from '../assets/img/award-poster.png';

const VALUES = [
  {
    icon: '🌿',
    title: 'Honest Formulation',
    text: 'Every herb on the label is genuinely in the capsule, in a meaningful quantity. We would rather explain a higher cost than hide a cheaper filler.',
  },
  {
    icon: '🔬',
    title: 'Tested, Not Assumed',
    text: 'Raw material and finished goods are both checked. Batches are lab tested for identity and purity before a single pack leaves the unit.',
  },
  {
    icon: '📜',
    title: 'Responsible Claims',
    text: 'We talk about supporting energy, stamina and everyday wellness. We do not promise cures, and we always recommend consulting your physician.',
  },
  {
    icon: '🤝',
    title: 'Real Human Support',
    text: 'A person from our team calls to confirm every order and stays reachable afterwards. No chatbots standing between you and an answer.',
  },
];

const TIMELINE = [
  {
    step: 'Step One',
    title: 'Sourcing',
    text: 'Herbs are procured from established Indian growers and suppliers, with documentation for each consignment.',
  },
  {
    step: 'Step Two',
    title: 'Identity & Purity Testing',
    text: 'Incoming raw material is verified for identity and screened before it is cleared for processing.',
  },
  {
    step: 'Step Three',
    title: 'Blending in a GMP Unit',
    text: 'Extracts are blended to a fixed formula under controlled conditions, so capsule thirty matches capsule one.',
  },
  {
    step: 'Step Four',
    title: 'Encapsulation & Sealing',
    text: 'Capsules are filled, bottled and tamper-sealed with batch number and manufacturing details printed on pack.',
  },
  {
    step: 'Step Five',
    title: 'Final Batch Release',
    text: 'A finished-goods check clears the batch. Only then is it released for dispatch to customers.',
  },
];

export default function About() {
  const pageRef = useRef(null);
  useRevealOnMount(pageRef);

  useEffect(() => {
    document.title = 'About Us | Herbal Gujarat — Premium Ayurvedic Wellness';
  }, []);

  return (
    <main ref={pageRef}>
      <TopBar />
      <Header />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'About Us' }]}
        title={
          <>
            Rooted in <span className="gold-text">Ayurveda</span>
          </>
        }
        subtitle="Herbal Gujarat brings classical herbal wisdom into a form that fits modern life — honestly made, properly tested, plainly labelled."
      />

      <section className="section">
        <div className="wrap">
          <div className="split">
            <div className="split__media reveal">
              <img src={bottleImage} alt="Herbal King's Man bottle by Herbal Gujarat" className="is-contain" />
            </div>
            <div className="reveal">
              <span className="eyebrow">Our Story</span>
              <h2>Ancient Herbs, Modern Standards</h2>
              <div className="rule" />
              <p>
                Herbal Gujarat began with a simple observation: men across our state were looking for a wellness
                supplement they could actually trust — one with an ingredient list they could read, made in a
                facility that could be audited, and priced within reach of an ordinary household.
              </p>
              <p>
                So we built exactly that. Our flagship formula,{' '}
                <strong style={{ color: 'var(--green)' }}>Herbal King&apos;s Man</strong>, brings together four herbs
                long respected in classical Ayurveda — Shilajit, Ashwagandha, Safed Musli and Gokhru — in an easy
                daily capsule prepared in a GMP certified unit and tested batch by batch.
              </p>
              <p>
                No exaggerated promises. No hidden fillers. Just herbal goodness, made in India, delivered to your
                door with free shipping and the option to pay on delivery.
              </p>
              <Link to="/kings-man" className="btn btn--green">
                Explore King&apos;s Man
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--green">
        <div className="wrap">
          <div className="stats reveal">
            <div className="stat">
              <b>10,000+</b>
              <span>Packs Delivered</span>
            </div>
            <div className="stat">
              <b>4.8★</b>
              <span>Average Rating</span>
            </div>
            <div className="stat">
              <b>4</b>
              <span>Signature Herbs</span>
            </div>
            <div className="stat">
              <b>100%</b>
              <span>Natural Formula</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">What We Stand For</span>
            <h2>Four Non-Negotiables</h2>
            <div className="rule" />
            <p className="lead">
              These are the rules we set for ourselves before the first bottle ever shipped — and we have not bent
              them since.
            </p>
          </div>

          <div className="grid grid--2" style={{ marginTop: 46 }}>
            {VALUES.map((value) => (
              <article className="value reveal" key={value.title}>
                <div className="value__ic">{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">From Herb to Capsule</span>
            <h2>How Every Pack Is Made</h2>
            <div className="rule" />
          </div>

          <ul className="timeline reveal" style={{ marginTop: 44 }}>
            {TIMELINE.map((item) => (
              <li key={item.title}>
                <em>{item.step}</em>
                <b>{item.title}</b>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="split split--rev">
            <div className="split__media reveal">
              <img src={awardImage} alt="Ayurvedic excellence award and certificate of authenticity and purity" />
            </div>
            <div className="reveal">
              <span className="eyebrow">Quality &amp; Compliance</span>
              <h2>Certified at Every Step</h2>
              <div className="rule" />
              <p>
                Certification is not decoration for us — it is the audit trail that lets you take a supplement
                seriously. Herbal Gujarat products carry the marks below, and we are happy to share documentation on
                request.
              </p>
              <ul className="checks">
                <li>
                  <strong style={{ color: 'var(--green)' }}>ISI Certified</strong> — conformity to Indian standards
                </li>
                <li>
                  <strong style={{ color: 'var(--green)' }}>FSSAI Registered</strong> — licensed food supplement
                  manufacture
                </li>
                <li>
                  <strong style={{ color: 'var(--green)' }}>GMP Certified Unit</strong> — good manufacturing practice
                  compliance
                </li>
                <li>
                  <strong style={{ color: 'var(--green)' }}>Lab Tested Batches</strong> — identity and purity checks
                  per batch
                </li>
                <li>
                  <strong style={{ color: 'var(--green)' }}>100% Natural</strong> — plant-based Ayurvedic ingredients
                </li>
                <li>
                  <strong style={{ color: 'var(--green)' }}>Made in India</strong> — manufactured in Gujarat
                </li>
              </ul>
              <Link to="/contact" className="btn btn--outline">
                Request Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        eyebrow="Your Daily Wellness Partner"
        heading="Trusted Herbal Care"
        text="Try Herbal King's Man with free shipping and cash on delivery — and judge it on how you feel, not on what we claim."
        buttons={[
          { to: '/checkout?pack=combo', label: 'Order Today', variant: 'btn--gold' },
          { to: '/contact', label: 'Contact Us', variant: 'btn--ghost' },
        ]}
      />

      <Footer variant="full" />
    </main>
  );
}
