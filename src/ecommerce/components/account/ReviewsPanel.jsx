import React, { useEffect, useState } from 'react';
import * as hg from '../../lib/hg.js';

export default function ReviewsPanel({ orders, reviews, presetOrderId, onAdd, onDelete }) {
  const [rating, setRating] = useState(0);
  const [orderId, setOrderId] = useState(presetOrderId || '');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (presetOrderId) setOrderId(presetOrderId);
  }, [presetOrderId]);

  const reviewableOrders = orders.filter((order) => order.status !== 'cancelled');

  function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setOk('');
    const result = onAdd({ rating, orderId, title, text });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOk('Thank you for the review — it is now visible on the product page.');
    setRating(0);
    setOrderId('');
    setTitle('');
    setText('');
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>My Reviews</h2>
          <p>Tell other customers what your experience has been like.</p>
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <div className="alert alert--err" hidden={!error}>
          {error}
        </div>
        <div className="alert alert--ok" hidden={!ok}>
          {ok}
        </div>

        <div className="field">
          <label>Your Rating *</label>
          <div className="rate" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={value <= rating ? 'is-on' : undefined}
                aria-label={`${value} star${value > 1 ? 's' : ''}`}
                onClick={() => setRating(value)}
              >
                ★
              </button>
            ))}
          </div>
          <span className="field__hint">{rating ? `${rating} out of 5 stars selected` : 'Tap a star to rate'}</span>
        </div>

        <div className="form__row">
          <div className="field">
            <label htmlFor="rv-order">Order (optional)</label>
            <select id="rv-order" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">Not linked to an order</option>
              {reviewableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.ref} — {order.product}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rv-title">Review Title</label>
            <input type="text" id="rv-title" placeholder="Sum it up in a few words" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="rv-text">Your Review *</label>
          <textarea
            id="rv-text"
            placeholder="How has the product been for you? How long have you been using it?"
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn--gold btn--lg">
          Submit Review
        </button>
      </form>

      <h3 style={{ fontSize: '1.15rem', paddingTop: 22, borderTop: '1px solid var(--green-line)' }}>Your Submitted Reviews</h3>
      <div className="rlist">
        {!reviews.length && (
          <div className="empty">
            <em>⭐</em>
            <h3>No reviews yet</h3>
            <p>Once you have used the product for a few weeks, your honest review helps other customers decide.</p>
          </div>
        )}
        {reviews.map((review) => (
          <article className="ritem" key={review.id}>
            <div className="ritem__top">
              <span className="ritem__stars">{hg.stars(review.rating)}</span>
              <span className="ritem__meta">
                {hg.formatDate(review.at)}
                {review.orderId ? ` · Order ${review.orderId}` : ''}
              </span>
            </div>
            {review.title && <h4>{review.title}</h4>}
            <p>{review.text}</p>
            <div className="addr__acts">
              <button type="button" onClick={() => onDelete(review.id)}>
                Delete review
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
