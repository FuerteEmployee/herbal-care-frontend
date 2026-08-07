import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import PageHead from '../components/layout/PageHead.jsx';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found | Herbal Gujarat';
  }, []);

  return (
    <main>
      <TopBar />
      <Header />
      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Page Not Found' }]}
        title={
          <>
            Page Not <span className="gold-text">Found</span>
          </>
        }
        subtitle="That page doesn't exist yet — try the blog listing or head back home."
      />
      <section className="section">
        <div className="wrap center">
          <Link to="/" className="btn btn--gold">
            Back to Home
          </Link>
        </div>
      </section>
      <Footer variant="full" />
    </main>
  );
}
