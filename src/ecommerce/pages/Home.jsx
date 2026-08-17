import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import EnquiryForm from '../components/EnquiryForm.jsx';
import { useSlider } from '../hooks/useSlider.js';
import { useRevealOnMount } from '../hooks/useRevealOnMount.js';
import bottleImage from '../assets/img/bottle-front.webp';
import comboImage from '../assets/img/combo-front.webp';

const HERO_SLIDES = [
  {
    image: '/hero-1.webp',
    imageMobile: '/hero-1-mobile.webp',
    gradient: 'linear-gradient(120deg,#232a1f,#46523c 60%,#232a1f)',
    eyebrow: 'Start Every Day With Confidence',
    heading: (
      <>
        Herbal <em>King&apos;s Man</em>
      </>
    ),
    body: 'Premium Ayurvedic Wellness Formula for Modern Men — crafted with powerful ancient herbs and made in India.',
    tags: ['🌿 Herbal Goodness', '⚡ Daily Vitality', '💪 Natural Strength'],
    secondaryCta: { to: '/#products', label: 'Explore Products' },
  },
  {
    image: '/hero-2.webp',
    imageMobile: '/hero-2-mobile.webp',
    gradient: 'linear-gradient(120deg,#1b2117,#343d2e 55%,#1b2117)',
    eyebrow: "Naturally Support Men's Wellness",
    heading: (
      <>
        Nature&apos;s <em>Finest Herbs</em>
      </>
    ),
    body: 'Inspired by Ayurveda — Shilajit, Ashwagandha, Safed Musli and Gokhru blended into easy-to-take daily capsules.',
    tags: ['🌿 Vitality', '⚡ Energy', "💚 Men's Well-being"],
    secondaryCta: { to: '/#ingredients', label: 'See Ingredients' },
  },
  {
    image: '/hero-3.webp',
    imageMobile: '/hero-3-mobile.webp',
    gradient: 'linear-gradient(120deg,#241d10,#343d2e 55%,#1b2117)',
    eyebrow: '🎉 Limited Time Offer',
    heading: (
      <>
        Buy 1 <em>Get 1 Free</em>
      </>
    ),
    body: 'Double the wellness, double the value. The ultimate vitality combo pack — now at ₹1,499 instead of ₹2,999.',
    tags: ['🚚 Free Shipping', '💰 Cash on Delivery', '🛡 ISO Certified'],
    secondaryCta: { to: '/#inquiry', label: 'Enquire Today' },
  },
];

const TESTIMONIALS = [
  {
    quote:
      'A simple daily capsule that fits right into my routine. What convinced me was the honest ingredient list and the ISO and FSSAI certification on the pack.',
    name: 'Dharmesh Patel',
    location: 'Vadodara, Gujarat',
  },
  {
    quote:
      'I have been buying Ayurvedic products for years. Herbal Gujarat stands out for the quality of packaging and the support team that actually answers the phone.',
    name: 'Suresh Chaudhary',
    location: 'Mehsana, Gujarat',
  },
  {
    quote:
      'Free shipping and cash on delivery made the first order risk-free for me. The combo pack is excellent value — I have already recommended it to two friends.',
    name: 'Vipul Solanki',
    location: 'Bhavnagar, Gujarat',
  },
];

export default function Home() {
  const pageRef = useRef(null);
  const hero = useSlider(HERO_SLIDES.length, 6000);
  const testimonials = useSlider(TESTIMONIALS.length, 7000);
  // Everything from the trust strip down mounts one frame after the hero, so
  // the very first paint only has to lay out the header + hero (~80 nodes)
  // instead of the whole page (~300+ nodes, most of it below the fold). A
  // real trace (4x CPU throttle, matching Lighthouse's mobile preset) showed
  // that first Layout pass alone costing ~525ms of the ~1050ms to first
  // paint — content-visibility:auto on the sections below doesn't save this
  // because the browser still has to lay the whole document out once before
  // it knows what's off-screen. Deferring the mount by a frame means that
  // first layout only ever sees the small tree; the rest lands in a second,
  // much cheaper incremental layout right after. Nothing here is visible
  // above the fold, so there's no CLS — the content only grows below
  // whatever the visitor can already see.
  const [ready, setReady] = useState(false);
  useRevealOnMount(pageRef, [ready]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    document.title = "Herbal Gujarat | Herbal King's Man";
  }, []);

  return (
    <main ref={pageRef}>
      <TopBar />
      <Header />

      <section className="hero" aria-label="Featured highlights" {...hero.sliderProps}>
        <div className="slides">
          {HERO_SLIDES.map((slide, index) => (
            <article key={slide.eyebrow} className={`slide${index === hero.index ? ' is-active' : ''}`}>
              <div className="slide__bg" style={{ background: slide.gradient }}>
                <picture>
                  <source media="(max-width: 768px)" srcSet={slide.imageMobile} type="image/webp" />
                  <img
                    src={slide.image}
                    alt="Herbal King's Man Ayurvedic Wellness"
                    fetchPriority={index === 0 ? 'high' : 'low'}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    width="1672"
                    height="941"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </picture>
              </div>
              <div className="slide__in">
                <div className="wrap">
                  <div className="slide__body">
                    <span className="eyebrow">{slide.eyebrow}</span>
                    {index === 0 ? <h1>{slide.heading}</h1> : <h2 className="slide__title">{slide.heading}</h2>}
                    <p>{slide.body}</p>
                    <ul className="slide__tags">
                      {slide.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                    <div className="slide__btns">
                      <Link to="/checkout?pack=combo" className="btn btn--gold btn--lg" aria-label="Book King's Man combo pack now">
                        Book Now
                      </Link>
                      <a href={slide.secondaryCta.to} className="btn btn--ghost btn--lg">
                        {slide.secondaryCta.label}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <button type="button" className="hero__arrow hero__arrow--prev" aria-label="Previous slide" onClick={hero.prev}>
          <svg viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button type="button" className="hero__arrow hero__arrow--next" aria-label="Next slide" onClick={hero.next}>
          <svg viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>

        <div className="hero__dots" role="tablist" aria-label="Slide selection">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.eyebrow}
              type="button"
              className={index === hero.index ? 'is-active' : undefined}
              role="tab"
              aria-label={`Slide ${index + 1}`}
              aria-selected={index === hero.index}
              onClick={() => hero.goTo(index)}
            />
          ))}
        </div>
      </section>

      {ready && (
      <>
      <section className="trust">
        <div className="wrap">
          <div className="trust__in">
            <div className="trust__item">
              <strong>100% Natural</strong>
              <span>Herbal formulation</span>
            </div>
            <div className="trust__item">
              <strong>ISI &amp; FSSAI</strong>
              <span>Certified quality</span>
            </div>
            <div className="trust__item">
              <strong>GMP Unit</strong>
              <span>Lab tested batches</span>
            </div>
            <div className="trust__item">
              <strong>Made in India</strong>
              <span>Proudly from Gujarat</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="products">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">Our Products</span>
            <h2>Premium Ayurvedic Wellness</h2>
            <div className="rule" />
            <p className="lead">
              Every pack from Herbal Gujarat is built on classical Ayurvedic wisdom and prepared in a certified
              facility — so you get herbal goodness you can trust, every single day.
            </p>
          </div>

          <div className="grid grid--2" style={{ marginTop: 46, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
            <article className="card reveal">
              <div className="pcard__media">
                <span className="badge">Bestseller</span>
                <img
                  src={bottleImage}
                  alt="Herbal King's Man 30 capsules bottle"
                  width="800"
                  height="800"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="pcard__body">
                <div className="pcard__meta">30 Capsules · Single Pack</div>
                <h3>Herbal King&apos;s Man</h3>
                <p>
                  Premium Ayurvedic wellness formula that supports daily energy, natural stamina and an active
                  lifestyle for modern men.
                </p>
                <div className="pcard__foot">
                  <span className="price">
                    <b>₹999</b>
                    <s>₹1,499</s>
                  </span>
                  <div className="pcard__actions">
                    <Link to="/kings-man" className="btn btn--outline btn--sm" aria-label="View Herbal King's Man single pack details">
                      View
                    </Link>
                    <Link to="/checkout?pack=single" className="btn btn--gold btn--sm" aria-label="Buy Herbal King's Man single pack now">
                      Buy Now
                    </Link>
                  </div>
                </div>
              </div>
            </article>

            <article className="card reveal">
              <div className="pcard__media pcard__media--poster">
                <span className="badge badge--green">Buy 1 Get 1</span>
                <img
                  src={comboImage}
                  alt="Herbal King's Man buy one get one free combo pack"
                  width="800"
                  height="800"
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: 'center 30%' }}
                />
              </div>
              <div className="pcard__body">
                <div className="pcard__meta">60 Capsules · Combo Pack</div>
                <h3>King&apos;s Man Combo</h3>
                <p>
                  The ultimate vitality combo — two full bottles for the price of one. Ideal for a complete two-month
                  wellness routine.
                </p>
                <div className="pcard__foot">
                  <span className="price">
                    <b>₹1,499</b>
                    <s>₹2,999</s>
                  </span>
                  <div className="pcard__actions">
                    <Link to="/kings-man-combo" className="btn btn--outline btn--sm" aria-label="View King's Man combo pack details">
                      View
                    </Link>
                    <Link to="/checkout?pack=combo" className="btn btn--gold btn--sm" aria-label="Buy King's Man combo pack now">
                      Buy Now
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="offer">
        <div className="wrap">
          <div className="offer__in">
            <div className="reveal">
              <span className="offer__tag">🎉 Limited Time Offer</span>
              <h2>
                Buy 1 <em>Get 1 Free</em>
              </h2>
              <p>Double the Wellness. Double the Value. Special limited offer on the Herbal King&apos;s Man combo pack.</p>
              <div className="offer__price">
                <b>₹1,499</b>
                <s>₹2,999</s>
                <i>Save 50%</i>
              </div>
              <Link to="/checkout?pack=combo" className="btn btn--gold btn--lg">
                Book Now
              </Link>

              <ul className="offer__perks">
                <li>
                  <svg viewBox="0 0 24 24">
                    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
                    <circle cx="7" cy="18" r="1.6" />
                    <circle cx="17" cy="18" r="1.6" />
                  </svg>
                  Free Shipping
                </li>
                <li>
                  <svg viewBox="0 0 24 24">
                    <rect x="2.5" y="6" width="19" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.6" />
                  </svg>
                  Cash on Delivery
                </li>
                <li>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3l7 3v6c0 4-3 7.2-7 9-4-1.8-7-5-7-9V6z" />
                    <path d="M9 12l2.2 2.2L15.5 10" />
                  </svg>
                  ISO Certified
                </li>
              </ul>
            </div>

            <div className="offer__media reveal">
              <img
                src={comboImage}
                alt="Herbal King's Man combo pack offer — buy one get one free at ₹1499"
                width="800"
                height="800"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="benefits">
        <div className="wrap">
          <div className="split">
            <div className="split__media reveal">
              <img
                src={bottleImage}
                alt="Herbal King's Man 30 capsule bottle, front view"
                className="is-contain"
                width="800"
                height="800"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="reveal">
              <span className="eyebrow">Premium Benefits</span>
              <h2>Herbal King&apos;s Man</h2>
              <div className="rule" />
              <p>
                Premium Ayurvedic Wellness Formula, designed as a simple daily habit for men who want to stay active
                and feel their best.
              </p>
              <ul className="checks">
                <li>Supports Daily Energy &amp; Vitality</li>
                <li>Helps Maintain Natural Stamina</li>
                <li>Promotes an Active Lifestyle</li>
                <li>Supports Physical Endurance</li>
                <li>Made with Powerful Ayurvedic Herbs</li>
                <li>Easy-to-Take Daily Capsules</li>
              </ul>
              <Link to="/kings-man" className="btn btn--green">
                Discover the Formula
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--cream" id="ingredients">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">Premium Ingredients</span>
            <h2>Nature&apos;s Finest Herbs</h2>
            <div className="rule" />
            <p className="lead">
              Crafted with traditional Ayurvedic ingredients, each selected for its long-standing place in classical
              herbal practice.
            </p>
          </div>

          <div className="grid grid--4" style={{ marginTop: 46 }}>
            <article className="herb reveal">
              <div className="herb__icon">🌿</div>
              <h3>Shilajit</h3>
              <p>Supports natural energy and vitality.</p>
            </article>
            <article className="herb reveal">
              <div className="herb__icon">🌱</div>
              <h3>Ashwagandha</h3>
              <p>Helps manage everyday stress while supporting overall wellness.</p>
            </article>
            <article className="herb reveal">
              <div className="herb__icon">🍃</div>
              <h3>Safed Musli</h3>
              <p>Traditionally valued for strength and stamina.</p>
            </article>
            <article className="herb reveal">
              <div className="herb__icon">🌾</div>
              <h3>Gokhru</h3>
              <p>Supports men's wellness and an active lifestyle.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="reviews">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">Customer Reviews</span>
            <h2>Rated 4.8 out of 5</h2>
            <div className="rule" />
            <p className="lead">Based on verified feedback from customers across Gujarat and the rest of India.</p>
          </div>

          <div className="grid grid--3" style={{ marginTop: 46 }}>
            <article className="review reveal">
              <div className="review__stars" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <p>
                &ldquo;Packaging is genuinely premium and the capsules are easy to take with my morning routine. I
                have kept it going for two months now and feel good about my daily energy.&rdquo;
              </p>
              <div className="review__who">
                <div className="review__av" aria-hidden="true">
                  R
                </div>
                <div>
                  <strong>Rakesh P.</strong>
                  <span>Rajkot, Gujarat</span>
                </div>
              </div>
            </article>
            <article className="review reveal">
              <div className="review__stars" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <p>
                &ldquo;Ordered the buy one get one combo. Delivery was quick, cash on delivery worked without any
                issue, and the team called to confirm my order politely.&rdquo;
              </p>
              <div className="review__who">
                <div className="review__av" aria-hidden="true">
                  J
                </div>
                <div>
                  <strong>Jignesh M.</strong>
                  <span>Surat, Gujarat</span>
                </div>
              </div>
            </article>
            <article className="review reveal">
              <div className="review__stars" aria-label="4 out of 5 stars">
                ★★★★☆
              </div>
              <p>
                &ldquo;I liked that the herbs are clearly listed — Shilajit, Ashwagandha, Safed Musli, Gokhru.
                Trustworthy Ayurvedic product with proper certification marks.&rdquo;
              </p>
              <div className="review__who">
                <div className="review__av" aria-hidden="true">
                  A
                </div>
                <div>
                  <strong>Amit S.</strong>
                  <span>Ahmedabad, Gujarat</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--green" id="testimonials" {...testimonials.sliderProps}>
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">Testimonials</span>
            <h2>Trusted Herbal Care</h2>
            <div className="rule" />
          </div>

          <div className="tslider reveal" style={{ marginTop: 40 }}>
            <div className="tslider__track">
              {TESTIMONIALS.map((testimonial, index) => (
                <article key={testimonial.name} className={`tsl${index === testimonials.index ? ' is-active' : ''}`}>
                  <div className="tsl__mark" aria-hidden="true">
                    &rdquo;
                  </div>
                  <p className="tsl__quote">{testimonial.quote}</p>
                  <span className="tsl__name">{testimonial.name}</span>
                  <span className="tsl__loc">{testimonial.location}</span>
                </article>
              ))}
            </div>

            <div className="tslider__dots" role="tablist" aria-label="Testimonial selection">
              {TESTIMONIALS.map((testimonial, index) => (
                <button
                  key={testimonial.name}
                  type="button"
                  className={index === testimonials.index ? 'is-active' : undefined}
                  role="tab"
                  aria-label={`Testimonial ${index + 1}`}
                  aria-selected={index === testimonials.index}
                  onClick={() => testimonials.goTo(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="inquiry">
        <div className="wrap">
          <div className="inquiry__in">
            <div className="reveal">
              <span className="eyebrow">Enquiry</span>
              <h2>Order or Ask Us Anything</h2>
              <div className="rule" />
              <p>
                Share your details and our wellness advisor will call you back within 24 hours to confirm your
                order, explain the dosage or answer any question about the formula.
              </p>

              <ul className="info-list">
                <li>
                  <span className="info-list__ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 5.5C4 4.7 4.7 4 5.5 4h2.2c.7 0 1.3.5 1.5 1.2l.7 3c.1.6-.1 1.2-.6 1.5l-1.4 1a11 11 0 004.4 4.4l1-1.4c.4-.5 1-.7 1.5-.6l3 .7c.7.2 1.2.8 1.2 1.5v2.2c0 .8-.7 1.5-1.5 1.5A15.5 15.5 0 014 5.5z" />
                    </svg>
                  </span>
                  <div>
                    <strong>Call Us</strong>
                    <span>
                      <a href="tel:+918469057530">+91 84690 57530</a>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="info-list__ic">
                    <svg viewBox="0 0 24 24">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M3.5 6.5L12 12.5l8.5-6" />
                    </svg>
                  </span>
                  <div>
                    <strong>Email</strong>
                    <span>
                      <a href="mailto:info@herbalgujratcare.com">info@herbalgujratcare.com</a>
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <EnquiryForm source="Home Page">
              <div className="form__row">
                <div className="field">
                  <label htmlFor="f-name">Full Name *</label>
                  <input type="text" id="f-name" name="name" placeholder="Your name" required />
                </div>
                <div className="field">
                  <label htmlFor="f-phone">Mobile Number *</label>
                  <input type="tel" id="f-phone" name="phone" placeholder="10-digit mobile" pattern="[0-9]{10}" maxLength={10} minLength={10} required />
                </div>
              </div>

              <div className="form__row">
                <div className="field">
                  <label htmlFor="f-email">Email</label>
                  <input type="email" id="f-email" name="email" placeholder="you@example.com" />
                </div>
                <div className="field">
                  <label htmlFor="f-city">City</label>
                  <input type="text" id="f-city" name="city" placeholder="Your city" />
                </div>
              </div>

              <div className="field">
                <label htmlFor="f-pack">Select Pack</label>
                <select id="f-pack" name="pack">
                  <option>King&apos;s Man Combo — Buy 1 Get 1 Free (₹1,499)</option>
                  <option>Herbal King&apos;s Man — Single Pack, 30 Capsules (₹999)</option>
                  <option>Not sure yet — please advise me</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="f-msg">Message</label>
                <textarea id="f-msg" name="message" placeholder="Tell us what you would like to know..." />
                <span className="field__hint">We never share your details with third parties.</span>
              </div>

              <button type="submit" className="btn btn--gold btn--block btn--lg">
                Send Enquiry
              </button>
              <p className="form__note">
                Or call us directly at{' '}
                <a href="tel:+918469057530" style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>
                  +91 84690 57530
                </a>
              </p>
            </EnquiryForm>
          </div>
        </div>
      </section>

      {/* The "Start Every Day With Confidence" CTA banner used to sit here.
          Removed from the home page only — the component is unchanged and the
          other pages still use it. */}

      <Footer variant="full" />
      </>
      )}
    </main>
  );
}
