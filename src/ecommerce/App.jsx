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
import ScrollToTop from './components/ScrollToTop.jsx';

export default function App() {
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
      <Route path="/blog-shilajit-daily-energy" element={<BlogShilajitDailyEnergy />} />
      <Route path="/blog-ashwagandha-everyday-stress" element={<BlogAshwagandhaEverydayStress />} />
      <Route path="/blog-morning-routine-men-30" element={<BlogMorningRoutineMen30 />} />
      <Route path="/blog-safed-musli-gokhru" element={<BlogSafedMusliGokhru />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<TermsConditions />} />
      <Route path="/shipping-policy" element={<ShippingPolicy />} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
