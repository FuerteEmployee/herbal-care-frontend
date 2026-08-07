import React, { useEffect } from 'react';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import PageHead from '../components/layout/PageHead.jsx';

export default function ShippingPolicy() {
  useEffect(() => {
    document.title = "Shipping Policy | Herbal Gujarat";
  }, []);

  return (
    <main>
      <TopBar />
      <Header />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Shipping Policy' }]}
        title="Shipping Policy"
        subtitle="Last updated: August 2026"
      />

      <section className="section">
        <div className="wrap" style={{ maxWidth: 800, marginInline: 'auto' }}>
          <div className="reveal is-in">
            <h3>1. Free Delivery Across India</h3>
            <p>
              We provide free standard shipping for all orders placed on our storefront to any address within India.
              There are no hidden costs or delivery fees added at checkout.
            </p>

            <h3 style={{ marginTop: 32 }}>2. Processing &amp; Dispatch</h3>
            <p>
              Before dispatching, our support team will call you to confirm your mobile number and shipping address.
              Once confirmed, packages are packed and shipped within 24 to 48 working hours.
            </p>

            <h3 style={{ marginTop: 32 }}>3. Transit Times</h3>
            <p>
              Standard transit times vary depending on the destination:
            </p>
            <ul>
              <li><strong>Within Gujarat:</strong> 2 to 4 working days.</li>
              <li><strong>Rest of India:</strong> 4 to 7 working days.</li>
            </ul>
            <p style={{ marginTop: 10 }}>
              Tracking details are sent to your account dashboard once the order is handed over to the courier partner.
            </p>

            <h3 style={{ marginTop: 32 }}>4. Cash on Delivery (COD)</h3>
            <p>
              Cash on Delivery is available for all serviceable pin codes at no additional charge.
              Please pay the exact amount printed on the package invoice to the courier person.
            </p>
          </div>
        </div>
      </section>

      <Footer variant="full" />
    </main>
  );
}
