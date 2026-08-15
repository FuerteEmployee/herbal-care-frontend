import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import { BLOG_POSTS } from './data/blogPosts.js';
import { useContentProtection } from './lib/contentProtection.js';
import { useMetaPixel } from './hooks/useMetaPixel.js';

// Code-splitting for non-home routes
const KingsMan = lazy(() => import('./pages/KingsMan.jsx'));
const KingsManCombo = lazy(() => import('./pages/KingsManCombo.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const Blog = lazy(() => import('./pages/Blog.jsx'));
const BlogShilajitDailyEnergy = lazy(() => import('./pages/BlogShilajitDailyEnergy.jsx'));
const BlogAshwagandhaEverydayStress = lazy(() => import('./pages/BlogAshwagandhaEverydayStress.jsx'));
const BlogMorningRoutineMen30 = lazy(() => import('./pages/BlogMorningRoutineMen30.jsx'));
const BlogSafedMusliGokhru = lazy(() => import('./pages/BlogSafedMusliGokhru.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy.jsx'));
const TermsConditions = lazy(() => import('./pages/TermsConditions.jsx'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const BlogReadSupplementLabel = lazy(() => import('./pages/BlogReadSupplementLabel.jsx'));
const BlogSleepDietStamina = lazy(() => import('./pages/BlogSleepDietStamina.jsx'));

const BLOG_PAGES = {
  'shilajit-daily-energy': BlogShilajitDailyEnergy,
  'ashwagandha-everyday-stress': BlogAshwagandhaEverydayStress,
  'morning-routine-men-30': BlogMorningRoutineMen30,
  'safed-musli-gokhru': BlogSafedMusliGokhru,
  'read-supplement-label': BlogReadSupplementLabel,
  'sleep-diet-stamina': BlogSleepDietStamina,
};

if (import.meta.env.DEV) {
  const orphaned = BLOG_POSTS.filter((post) => !BLOG_PAGES[post.slug]).map((post) => post.slug);
  if (orphaned.length > 0) {
    console.error(
      `[blog] no page component for: ${orphaned.join(', ')} — ` +
      'their cards render on /blog but the link 404s. Add them to BLOG_PAGES in App.jsx.',
    );
  }
}

export default function App() {
  useContentProtection();
  useMetaPixel();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div style={{ minHeight: '50vh' }} />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kings-man" element={<KingsMan />} />
          <Route path="/kings-man-combo" element={<KingsManCombo />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/account" element={<Account />} />
          <Route path="/blog" element={<Blog />} />
          {BLOG_POSTS.map((post) => {
            const Page = BLOG_PAGES[post.slug];
            return Page ? <Route key={post.slug} path={post.path} element={<Page />} /> : null;
          })}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsConditions />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
