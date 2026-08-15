import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';

import PageHead from '../components/layout/PageHead.jsx';
import EnquiryForm from '../components/EnquiryForm.jsx';
import { useRevealOnMount } from '../hooks/useRevealOnMount.js';
import awardImage from '../assets/img/award-poster.webp';
import bottleImage from '../assets/img/bottle-front.webp';
import comboImage from '../assets/img/combo-front.webp';
import ingredientsImage from '../assets/img/ingredients-poster.webp';

const galleryItems = [
  { src: bottleImage, alt: "Herbal King's Man 30 capsule bottle, front view", fit: 'contain' },
  { src: comboImage, alt: "Herbal King's Man combo offer pack", fit: 'cover' },
  { src: ingredientsImage, alt: 'Shilajit, Ashwagandha, Safed Musli and Gokhru herbs', fit: 'cover' },
  { src: awardImage, alt: "Certificate and award for Herbal King's Man", fit: 'cover' },
];

const reviews = [
  {
    name: 'Rakesh P.',
    city: 'Rajkot, Gujarat',
    rating: 5,
    title: 'Premium packaging, easy routine',
    text: 'Packaging is genuinely premium and the capsules are easy to take with my morning routine. I have kept it going for two months now and feel good about my daily energy.',
    date: '18 Jun 2026',
  },
  {
    name: 'Jignesh M.',
    city: 'Surat, Gujarat',
    rating: 5,
    title: 'Smooth COD experience',
    text: 'Ordered the buy one get one combo. Delivery was quick, cash on delivery worked without any issue, and the team called to confirm my order politely.',
    date: '02 Jun 2026',
  },
  {
    name: 'Amit S.',
    city: 'Ahmedabad, Gujarat',
    rating: 4,
    title: 'Clear ingredient list',
    text: 'I liked that the herbs are clearly listed — Shilajit, Ashwagandha, Safed Musli, Gokhru. Trustworthy Ayurvedic product with proper certification marks.',
    date: '21 May 2026',
  },
  {
    name: 'Dharmesh Patel',
    city: 'Vadodara, Gujarat',
    rating: 5,
    title: 'Fits into my day',
    text: 'A simple daily capsule that fits right into my routine. What convinced me was the honest ingredient list and the ISO and FSSAI certification on the pack.',
    date: '04 May 2026',
  },
  {
    name: 'Karan Shah',
    city: 'Nadiad, Gujarat',
    rating: 5,
    title: 'Helps with my active lifestyle',
    text: 'I work a retail job standing for 8 hours a day. This has been a great addition to my routine. Very happy with the quality.',
    date: '29 Apr 2026',
  },
  {
    name: 'Vijay Mehta',
    city: 'Ahmedabad, Gujarat',
    rating: 5,
    title: 'Great quality Shilajit',
    text: 'Lab tested batch by batch is what sold me. You can feel the purity of the herbs. Highly recommend.',
    date: '15 Apr 2026',
  },
  {
    name: 'Sanjay V.',
    city: 'Mehsana, Gujarat',
    rating: 5,
    title: 'Excellent customer support',
    text: 'They called to confirm my shipping address and delivered within 2 days in Mehsana. Authentic packaging and seals.',
    date: '08 Apr 2026',
  },
  {
    name: 'Rajesh Patel',
    city: 'Anand, Gujarat',
    rating: 4,
    title: 'Very consistent results',
    text: 'On my second bottle now. It takes a few weeks to show results, but consistency pays off. A solid Ayurvedic formula.',
    date: '27 Mar 2026',
  },
  {
    name: 'Mahendra G.',
    city: 'Bhavnagar, Gujarat',
    rating: 5,
    title: 'Top class packaging',
    text: 'Clean, premium, vegetarian capsules. Much better than messy powders. Will definitely purchase again.',
    date: '11 Mar 2026',
  },
];

const FAQS = [
  {
    q: 'How many capsules should I take in a day?',
    a: 'One capsule daily with lukewarm water after a meal is the recommended dose. Do not exceed the stated dose. If you are on any medication or have an existing medical condition, please consult your physician before starting.',
  },
  {
    q: 'How long before I notice a difference?',
    a: 'Ayurvedic formulations act gradually and support your body over time. We recommend a consistent course of 60 to 90 days. Individual results vary depending on age, diet, sleep and overall lifestyle.',
  },
  {
    q: 'Is it safe to use daily?',
    a: "Herbal King's Man is prepared from plant-based Ayurvedic ingredients in a GMP certified unit and is lab tested batch by batch. It is intended for healthy adult men above 18. Pregnant or nursing individuals, minors and anyone under medical treatment should not use it without a doctor's advice.",
  },
  {
    q: 'What is included in the Buy 1 Get 1 Free offer?',
    a: 'You receive two sealed bottles of 30 capsules each — 60 capsules in total — at ₹1,499 instead of ₹2,999. Shipping is free anywhere in India and cash on delivery is available.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Orders are dispatched within 24 to 48 working hours. Delivery usually takes 3 to 5 days within Gujarat and 5 to 7 days for the rest of India. Our team calls you to confirm every order before dispatch.',
  },
  {
    q: 'Can I pay on delivery?',
    a: 'Yes. Cash on delivery is available across India at no extra charge. You may also pay online in advance if you prefer.',
  },
];

function stars(n) {
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

export default function KingsMan() {
  const pageRef = useRef(null);
  const [activeThumb, setActiveThumb] = useState(0);
  const reviewSummary = useMemo(() => ({ avg: 4.8, total: 1240 }), []);
  const activeImage = galleryItems[activeThumb];
  useRevealOnMount(pageRef);

  useEffect(() => {
    document.title = "Herbal King's Man | Herbal Gujarat";
  }, []);

  return (
    <main ref={pageRef}>
      <TopBar />
      <Header bookNowHref="/checkout?pack=single" />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: "Herbal King's Man Single Pack" }]}
        title={
          <>
            Herbal <span className="gold-text">King&apos;s Man</span>
          </>
        }
        subtitle="Premium Ayurvedic Wellness Formula for Modern Men — Single 30-capsule pack."
      />

      <section className="section">
        <div className="wrap">
          <div className="pdp">
            <div className="reveal">
              <div className="gallery__main">
                <img src={activeImage.src} alt={activeImage.alt} className={activeImage.fit === 'cover' ? 'is-cover' : ''} />
              </div>
              <div className="thumbs">
                {galleryItems.map((item, index) => (
                  <button
                    key={item.src}
                    type="button"
                    className={`thumb${index === activeThumb ? ' is-active' : ''}`}
                    aria-label={item.alt}
                    onClick={() => setActiveThumb(index)}
                  >
                    <img src={item.src} alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="reveal">
              <span className="eyebrow">Ayurvedic Formula</span>
              <h2 className="pdp__title">Herbal King&apos;s Man — Single Pack</h2>
              <div className="pdp__rate">
                <span className="stars" aria-hidden="true">★★★★★</span>
                <span>
                  <b style={{ color: 'var(--green)' }}>4.8</b> · 1,240+ verified buyers
                </span>
              </div>

              <p>
                A premium Ayurvedic wellness formula for men who want to stay energetic and active through a
                demanding day. Each easy-to-take capsule carries a balanced blend of Shilajit, Ashwagandha, Safed
                Musli and Gokhru — herbs valued in classical Ayurveda for strength and vitality.
              </p>

              <div className="pdp__price">
                <b>₹999</b>
                <s>₹1,499</s>
              </div>
              <p style={{ fontSize: '.9rem', margin: '-8px 0 22px', color: '#8b917f' }}>
                One sealed bottle — 30 capsules. Inclusive of all taxes.
              </p>

              <ul className="checks">
                <li>Supports Daily Energy &amp; Vitality</li>
                <li>Helps Maintain Natural Stamina</li>
                <li>Promotes an Active Lifestyle</li>
                <li>Supports Physical Endurance</li>
                <li>Made with Powerful Ayurvedic Herbs</li>
                <li>Easy-to-Take Daily Capsules</li>
              </ul>

              <div className="pdp__buy">
                <Link to="/checkout?pack=single" className="btn btn--gold btn--lg">
                  Book Now
                </Link>
              </div>
              <p style={{ fontSize: '.88rem', margin: '-10px 0 22px' }}>
                Want to save more?{' '}
                <Link to="/kings-man-combo" style={{ color: 'var(--gold-deep)', fontWeight: 600, borderBottom: '1px solid var(--gold)' }}>
                  Buy 1 Get 1 Free Combo Pack at ₹1,499
                </Link>
              </p>

              <div className="pdp__ship">
                <div>
                  <em>🚚</em>Free Shipping
                </div>
                <div>
                  <em>💰</em>Cash on Delivery
                </div>
                <div>
                  <em>🛡</em>ISO Certified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--cream" id="benefits">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">Premium Benefits</span>
            <h2>Why Men Choose King&apos;s Man</h2>
            <div className="rule" />
            <p className="lead">One capsule, taken consistently, designed to slot into an everyday routine without any fuss.</p>
          </div>

          <div className="grid grid--3" style={{ marginTop: 46 }}>
            <article className="herb reveal">
              <div className="herb__icon">⚡</div>
              <h3>Daily Energy</h3>
              <p>Formulated to support your natural energy levels through a long working day.</p>
            </article>
            <article className="herb reveal">
              <div className="herb__icon">💪</div>
              <h3>Natural Stamina</h3>
              <p>Traditional herbs that help you maintain stamina and physical endurance.</p>
            </article>
            <article className="herb reveal">
              <div className="herb__icon">🌿</div>
              <h3>Herbal Goodness</h3>
              <p>A clean herbal blend with no shortcuts — prepared in a GMP certified unit.</p>
            </article>
            <article className="herb reveal">
              <div className="herb__icon">🧘</div>
              <h3>Everyday Calm</h3>
              <p>Ashwagandha helps manage everyday stress while supporting overall wellness.</p>
            </article>
            <article className="herb reveal">
              <div className="herb__icon">🏃</div>
              <h3>Active Lifestyle</h3>
              <p>Made for men who stay on their feet and want to keep up with their day.</p>
            </article>
            <article className="herb reveal">
              <div className="herb__icon">✅</div>
              <h3>Simple to Take</h3>
              <p>No powders or mixing — just one capsule with water after a meal.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="ingredients">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">Premium Ingredients</span>
              <h2>Nature&apos;s Finest Herbs</h2>
              <div className="rule" />
              <p>
                Crafted with traditional Ayurvedic ingredients — sourced, tested and blended so every capsule is
                consistent from the first to the thirtieth.
              </p>

              <ul className="info-list" style={{ marginTop: 26 }}>
                <li>
                  <span className="info-list__ic" style={{ fontSize: '1.1rem' }}>🌿</span>
                  <div>
                    <strong>Shilajit</strong>
                    <span>Supports natural energy and vitality.</span>
                  </div>
                </li>
                <li>
                  <span className="info-list__ic" style={{ fontSize: '1.1rem' }}>🌱</span>
                  <div>
                    <strong>Ashwagandha</strong>
                    <span>Helps manage everyday stress while supporting overall wellness.</span>
                  </div>
                </li>
                <li>
                  <span className="info-list__ic" style={{ fontSize: '1.1rem' }}>🍃</span>
                  <div>
                    <strong>Safed Musli</strong>
                    <span>Traditionally valued for strength and stamina.</span>
                  </div>
                </li>
                <li>
                  <span className="info-list__ic" style={{ fontSize: '1.1rem' }}>🌾</span>
                  <div>
                    <strong>Gokhru</strong>
                    <span>Supports men's wellness and an active lifestyle.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="split__media reveal">
              <img src={ingredientsImage} alt="Shilajit, Safed Musli, Ashwagandha and Gokhru — the herbs in Herbal King's Man" />
            </div>
          </div>
        </div>
      </section>

      <section className="offer" id="offer">
        <div className="wrap">
          <div className="offer__in">
            <div className="reveal">
              <span className="offer__tag">🎉 Limited Time Offer</span>
              <h2>
                Buy 1 <em>Get 1 Free</em>
              </h2>
              <p>
                Double the Wellness. Double the Value. The ultimate vitality combo pack — 60 capsules for a complete
                two-month routine.
              </p>
              <div className="offer__price">
                <b>₹1,499</b>
                <s>₹2,999</s>
                <i>Save 50%</i>
              </div>
              <Link to="/checkout?pack=combo" className="btn btn--gold btn--lg">
                Claim This Offer
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
              <img src={comboImage} alt="Buy one get one free combo pack of Herbal King's Man at ₹1499" />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="usage">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">How to Use</span>
            <h2>Three Simple Steps</h2>
            <div className="rule" />
            <p className="lead">
              Consistency matters more than quantity. Follow the routine below and give the herbs time to work with
              your body.
            </p>
          </div>

          <div className="grid grid--3 steps" style={{ marginTop: 46 }}>
            <article className="step reveal">
              <h3>Take One Capsule</h3>
              <p>One capsule a day with a glass of lukewarm water, after your meal — or as directed by your physician.</p>
            </article>
            <article className="step reveal">
              <h3>Stay Consistent</h3>
              <p>Keep it going daily for at least 60 to 90 days. Ayurvedic formulations work gradually, not overnight.</p>
            </article>
            <article className="step reveal">
              <h3>Support It Well</h3>
              <p>Pair it with balanced meals, adequate water and regular sleep to get the most out of your routine.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">Product Details</span>
              <h2>Specifications</h2>
              <div className="rule" />
              <div className="table-scroll">
                <table className="specs">
                  <tbody>
                    <tr>
                      <th>Product Name</th>
                      <td>Herbal King&apos;s Man</td>
                    </tr>
                    <tr>
                      <th>Category</th>
                      <td>Ayurvedic Dietary Supplement</td>
                    </tr>
                    <tr>
                      <th>Form</th>
                      <td>Vegetarian Capsules</td>
                    </tr>
                    <tr>
                      <th>Quantity</th>
                      <td>30 Capsules per bottle</td>
                    </tr>
                    <tr>
                      <th>Key Herbs</th>
                      <td>Shilajit, Ashwagandha, Safed Musli, Gokhru</td>
                    </tr>
                    <tr>
                      <th>Dosage</th>
                      <td>1 capsule daily after a meal</td>
                    </tr>
                    <tr>
                      <th>Certifications</th>
                      <td>ISI, FSSAI, GMP, Lab Tested</td>
                    </tr>
                    <tr>
                      <th>Shelf Life</th>
                      <td>24 months from manufacturing</td>
                    </tr>
                    <tr>
                      <th>Country of Origin</th>
                      <td>India — Made in Gujarat</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="split__media reveal">
              <img src={awardImage} alt="Ayurvedic excellence award and certificate of authenticity for Herbal King's Man" />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="reviews">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">Customer Reviews</span>
            <h2>What Buyers Say</h2>
            <div className="rule" />
            <p className="lead">
              <b style={{ color: 'var(--green)' }}>{reviewSummary.avg} out of 5</b> · based on {reviewSummary.total}{' '}
              reviews from verified customers.
            </p>
          </div>

          <div className="rlist reveal" style={{ marginTop: 40, maxWidth: 1180, marginInline: 'auto' }}>
            {reviews.map((review) => (
              <article className="ritem" key={review.name + review.date}>
                <div className="ritem__top">
                  <span className="ritem__stars">{stars(review.rating)}</span>
                  <span className="ritem__meta">{review.date}</span>
                </div>
                <h4>{review.title}</h4>
                <p>{review.text}</p>
                <div className="ritem__who">
                  <b>{review.name}</b>
                  {review.city ? ` · ${review.city}` : ''}
                </div>
              </article>
            ))}
          </div>

          <p className="center" style={{ marginTop: 30 }}>
            <Link to="/account" className="btn btn--outline">
              Write a Review
            </Link>
          </p>
        </div>
      </section>

      <section className="section section--cream" id="faq">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">FAQs</span>
            <h2>Questions, Answered</h2>
            <div className="rule" />
          </div>

          <div className="faq reveal" style={{ marginTop: 40 }}>
            {FAQS.map((item, index) => (
              <details key={item.q} open={index === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="order">
        <div className="wrap">
          <div className="reveal center" style={{ maxWidth: 640, margin: '0 auto 44px' }}>
            <span className="eyebrow">Fastest Way to Order</span>
            <h2>Book Online in a Minute</h2>
            <div className="rule" />
            <p>Choose your pack, save your address and get an order ID you can track — all from your own account.</p>
            <Link to="/checkout?pack=single" className="btn btn--gold btn--lg">
              Book Now
            </Link>
          </div>

          <div className="inquiry__in">
            <div className="reveal">
              <span className="eyebrow">Or Request a Callback</span>
              <h2>Let Us Call You</h2>
              <div className="rule" />
              <p>
                Not ready to order online? Share your details and our wellness advisor will call you within 24 hours
                to take the order over the phone. No advance payment needed — pay cash on delivery.
              </p>

              <ul className="info-list">
                <li>
                  <span className="info-list__ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 5.5C4 4.7 4.7 4 5.5 4h2.2c.7 0 1.3.5 1.5 1.2l.7 3c.1.6-.1 1.2-.6 1.5l-1.4 1a11 11 0 004.4 4.4l1-1.4c.4-.5 1-.7 1.5-.6l3 .7c.7.2 1.2.8 1.2 1.5v2.2c0 .8-.7 1.5-1.5 1.5A15.5 15.5 0 014 5.5z" />
                    </svg>
                  </span>
                  <div>
                    <strong>Order by Phone</strong>
                    <span>
                      <a href="tel:+918469057530">+91 84690 57530</a>
                    </span>
                  </div>
                </li>
                <li>
                  <span className="info-list__ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 3l7 3v6c0 4-3 7.2-7 9-4-1.8-7-5-7-9V6z" />
                      <path d="M9 12l2.2 2.2L15.5 10" />
                    </svg>
                  </span>
                  <div>
                    <strong>Genuine Product Guarantee</strong>
                    <span>Sealed pack, directly from the manufacturer.</span>
                  </div>
                </li>
                <li>
                  <span className="info-list__ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
                      <circle cx="7" cy="18" r="1.6" />
                      <circle cx="17" cy="18" r="1.6" />
                    </svg>
                  </span>
                  <div>
                    <strong>Free Shipping</strong>
                    <span>Delivered anywhere in India at no extra cost.</span>
                  </div>
                </li>
              </ul>
            </div>

            <EnquiryForm source="Product Page">
              <div className="form__row">
                <div className="field">
                  <label htmlFor="o-name">Full Name *</label>
                  <input type="text" id="o-name" name="name" placeholder="Your name" required />
                </div>
                <div className="field">
                  <label htmlFor="o-phone">Mobile Number *</label>
                  <input type="tel" id="o-phone" name="phone" placeholder="10-digit mobile" pattern="[0-9]{10}" maxLength={10} minLength={10} required />
                </div>
              </div>

              <div className="form__row">
                <div className="field">
                  <label htmlFor="o-city">City *</label>
                  <input type="text" id="o-city" name="city" placeholder="Your city" required />
                </div>
                <div className="field">
                  <label htmlFor="o-pin">Pincode</label>
                  <input type="text" id="o-pin" name="pincode" placeholder="6-digit pincode" pattern="[0-9]{6}" />
                </div>
              </div>

              <div className="form__row">
                <div className="field">
                  <label htmlFor="o-pack">Select Pack *</label>
                  <select id="o-pack" name="pack" required defaultValue="Single — 30 capsules (₹999)">
                    <option>Single — 30 capsules (₹999)</option>
                    <option>Combo — Buy 1 Get 1 Free, 60 capsules (₹1,499)</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="o-pay">Payment Mode</label>
                  <select id="o-pay" name="payment">
                    <option>Cash on Delivery</option>
                    <option>Online / UPI</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="o-addr">Delivery Address</label>
                <textarea id="o-addr" name="message" placeholder="House / street / landmark" />
                <span className="field__hint">Our advisor will confirm the address on call before dispatch.</span>
              </div>

              <button type="submit" className="btn btn--gold btn--block btn--lg">
                Request a Callback
              </button>
             </EnquiryForm>
          </div>
        </div>
      </section>

      <Footer variant="full" />
    </main>
  );
}
