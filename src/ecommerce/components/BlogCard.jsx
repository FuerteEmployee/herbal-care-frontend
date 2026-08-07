import React from 'react';
import { Link } from 'react-router-dom';

export default function BlogCard({ post, showExcerpt = false }) {
  return (
    <article className="card reveal">
      <Link className="bcard__media" to={post.path}>
        <span className="bcard__tag">{post.tag}</span>
        <img src={post.image} alt={post.imageAlt} />
      </Link>
      <div className="bcard__body">
        <div className="bcard__meta">
          <span>{post.date}</span>
          <span>{post.readTime}</span>
        </div>
        <h3>
          <Link to={post.path}>{post.title}</Link>
        </h3>
        {showExcerpt && <p>{post.excerpt}</p>}
        <Link className="bcard__more" to={post.path}>
          Read Article
          <svg viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
