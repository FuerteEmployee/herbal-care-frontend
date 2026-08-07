import React, { useEffect, useRef } from 'react';
import TopBar from '../components/layout/TopBar.jsx';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';

import PageHead from '../components/layout/PageHead.jsx';
import CTABanner from '../components/layout/CTABanner.jsx';
import BlogCard from '../components/BlogCard.jsx';
import { BLOG_POSTS } from '../data/blogPosts.js';
import { useRevealOnMount } from '../hooks/useRevealOnMount.js';

export default function Blog() {
  const pageRef = useRef(null);
  useRevealOnMount(pageRef);

  useEffect(() => {
    document.title = 'Ayurvedic Wellness Journal | Herbal Gujarat';
  }, []);

  return (
    <main ref={pageRef}>
      <TopBar />
      <Header />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Blog' }]}
        title={
          <>
            The Wellness <span className="gold-text">Journal</span>
          </>
        }
        subtitle="Plain-language notes on Ayurvedic herbs, daily routines and how to judge a supplement before you buy it — written by our wellness desk."
      />

      <section className="section">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">Latest Articles</span>
            <h2>Read Before You Buy</h2>
            <div className="rule" />
            <p className="lead">
              No miracle claims and no jargon — just what each herb is traditionally used for, how to build a
              routine you can keep, and what the marks on a pack actually mean.
            </p>
          </div>

          <div className="grid grid--3" style={{ marginTop: 46 }}>
            {BLOG_POSTS.map((post) => (
              <BlogCard key={post.slug} post={post} showExcerpt />
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        eyebrow="Your Daily Wellness Partner"
        heading="Start Every Day With Confidence"
        text="Read the articles, check the label, then try Herbal King's Man with free shipping and cash on delivery."
        buttons={[
          { to: '/checkout?pack=combo', label: 'Order Today', variant: 'btn--gold' },
          { to: '/kings-man', label: "Explore King's Man", variant: 'btn--ghost' },
        ]}
      />

      <Footer variant="blog" />
    </main>
  );
}
