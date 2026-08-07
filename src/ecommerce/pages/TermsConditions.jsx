import React, { useEffect } from 'react';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import PageHead from '../components/layout/PageHead.jsx';

export default function TermsConditions() {
  useEffect(() => {
    document.title = "Terms & Conditions | Herbal Gujarat";
  }, []);

  return (
    <main>
      <TopBar />
      <Header />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Terms & Conditions' }]}
        title="Terms & Conditions"
        subtitle="Last updated: August 2026"
      />

      <section className="section">
        <div className="wrap" style={{ maxWidth: 800, marginInline: 'auto' }}>
          <div className="reveal is-in">
            <h3>1. Terms of Service</h3>
            <p>
              By accessing this storefront or placing an order, you agree to comply with and be bound by these
              Terms and Conditions. Our products are offered subject to product availability and confirmation of order details.
            </p>

            <h3 style={{ marginTop: 32 }}>2. Product Use &amp; Information</h3>
            <p>
              Herbal King's Man is an Ayurvedic dietary supplement. All information on this storefront is for educational purposes
              and is not a substitute for professional medical advice. Always read labels and consult a physician if you have any health concerns.
            </p>

            <h3 style={{ marginTop: 32 }}>3. Ordering &amp; Pricing</h3>
            <p>
              Prices for our products are subject to change. We reserve the right to modify or discontinue products or packs at any time.
              Every order must be verified via phone call before dispatch. We reserve the right to cancel any order if verification fails.
            </p>

            <h3 style={{ marginTop: 32 }}>4. Liability</h3>
            <p>
              Herbal Gujarat shall not be liable for any direct or indirect consequences arising from the misuse of products,
              delivery delays by courier services, or incorrect information provided during checkout.
            </p>
          </div>
        </div>
      </section>

      <Footer variant="full" />
    </main>
  );
}
