import React, { useEffect, useRef } from 'react';
import TopBar from './layout/TopBar.jsx';
import Header from './layout/Header.jsx';
import Footer from './layout/Footer.jsx';

import PageHead from './layout/PageHead.jsx';
import CTABanner from './layout/CTABanner.jsx';
import BlogCard from './BlogCard.jsx';
import { useRevealOnMount } from '../hooks/useRevealOnMount.js';

export default function BlogPostLayout({
  documentTitle,
  breadcrumbLabel,
  title,
  subtitle,
  tag,
  date,
  readTime,
  heroImage,
  heroAlt,
  tags,
  related,
  cta,
  children,
}) {
  const pageRef = useRef(null);
  useRevealOnMount(pageRef);

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  return (
    <main ref={pageRef}>
      <TopBar />
      <Header />

      <PageHead
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Blog', to: '/blog' }, { label: breadcrumbLabel }]}
        title={title}
        subtitle={subtitle}
      />

      <section className="section">
        <div className="wrap">
          <article className="post reveal">
            <div className="post__meta">
              <span>
                <b>{tag}</b>
              </span>
              <span>{date}</span>
              <span>{readTime}</span>
              <span>Herbal Gujarat Wellness Desk</span>
            </div>

            <div className="post__hero">
              <img src={heroImage} alt={heroAlt} />
            </div>

            <div className="prose">{children}</div>

            <div className="tags">
              {tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section section--cream">
        <div className="wrap">
          <div className="head center reveal">
            <span className="eyebrow">Keep Reading</span>
            <h2>Related Articles</h2>
            <div className="rule" />
          </div>

          <div className="grid grid--3" style={{ marginTop: 44 }}>
            {related.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      <CTABanner {...cta} />

      <Footer variant="blog" />
    </main>
  );
}
