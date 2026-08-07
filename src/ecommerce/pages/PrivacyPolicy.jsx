import React, { useEffect } from 'react';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import PageHead from '../components/layout/PageHead.jsx';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | Herbal Gujarat";
  }, []);

  return (
    <main>
      <TopBar />
      <Header />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Privacy Policy' }]}
        title="Privacy Policy"
        subtitle="Last updated: August 2026"
      />

      <section className="section">
        <div className="wrap" style={{ maxWidth: 800, marginInline: 'auto' }}>
          <div className="reveal is-in">
            <h3>1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us when placing an order or requesting a callback.
              This includes your name, contact phone number, delivery shipping address, email address, and order selections.
            </p>

            <h3 style={{ marginTop: 32 }}>2. How We Use Your Information</h3>
            <p>
              We use your contact details to call you and verify shipping details before dispatching your order.
              Your delivery address is shared only with our trusted shipping/courier partners to deliver the physical product.
              We do not sell, lease, or share your personal details with third-party advertising networks.
            </p>

            <h3 style={{ marginTop: 32 }}>3. Order Security</h3>
            <p>
              All orders are processed securely. Account registration and orders details are stored on our encrypted
              local databases to keep track of your order status and verification history.
            </p>

            <h3 style={{ marginTop: 32 }}>4. Your Rights</h3>
            <p>
              You have the right to request a copy of the data we hold on you, or request that we delete your order details and
              account information from our active records at any time. Simply contact us at info@herbalgujratcare.com.
            </p>
          </div>
        </div>
      </section>

      <Footer variant="full" />
    </main>
  );
}
