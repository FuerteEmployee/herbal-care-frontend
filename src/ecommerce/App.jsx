import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import KingsMan from './pages/KingsMan.jsx';
import KingsManCombo from './pages/KingsManCombo.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Checkout from './pages/Checkout.jsx';
import Account from './pages/Account.jsx';
import Blog from './pages/Blog.jsx';
import BlogShilajitDailyEnergy from './pages/BlogShilajitDailyEnergy.jsx';
import BlogAshwagandhaEverydayStress from './pages/BlogAshwagandhaEverydayStress.jsx';
import BlogMorningRoutineMen30 from './pages/BlogMorningRoutineMen30.jsx';
import BlogSafedMusliGokhru from './pages/BlogSafedMusliGokhru.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsConditions from './pages/TermsConditions.jsx';
import ShippingPolicy from './pages/ShippingPolicy.jsx';
import NotFound from './pages/NotFound.jsx';
import BlogReadSupplementLabel from './pages/BlogReadSupplementLabel.jsx';
import BlogSleepDietStamina from './pages/BlogSleepDietStamina.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import { BLOG_POSTS } from './data/blogPosts.js';
import { useContentProtection } from './lib/contentProtection.js';

/*
 * Every post in BLOG_POSTS needs a page here, keyed by slug.
 *
 * The listing and the routes used to be maintained separately, and they drifted:
 * two posts had cards on /blog whose "Read Article" link pointed at a path no
 * <Route> matched, so it fell through to NotFound. Generating the routes from
 * the same list the cards come from means a post can no longer link to nothing.
 */
const BLOG_PAGES = {
  'shilajit-daily-energy': BlogShilajitDailyEnergy,
  'ashwagandha-everyday-stress': BlogAshwagandhaEverydayStress,
  'morning-routine-men-30': BlogMorningRoutineMen30,
  'safed-musli-gokhru': BlogSafedMusliGokhru,
  'read-supplement-label': BlogReadSupplementLabel,
  'sleep-diet-stamina': BlogSleepDietStamina,
};

// A post added without a page is a dead card on the blog listing, and nothing
// about it looks wrong until someone clicks. Say so at boot in development.
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

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kings-man" element={<KingsMan />} />
        <Route path="/kings-man-combo" element={<KingsManCombo />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account" element={<Account />} />
        <Route path="/blog" element={<Blog />} />
        {/* One route per post, straight from the list the cards are built from. */}
        {BLOG_POSTS.map((post) => {
          const Page = BLOG_PAGES[post.slug];
          return Page ? <Route key={post.slug} path={post.path} element={<Page />} /> : null;
        })}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
