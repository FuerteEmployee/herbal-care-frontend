import React, { useEffect, useRef, useState } from 'react';
import { sendEnquiry } from '../lib/api.js';

/**
 * Shared shell for every `data-enquiry`-style form (Home, Contact, and both
 * on KingsMan). Fields are page-specific children; this component owns the
 * generic submit behavior: native validation, sending a POST request to the
 * backend, showing a thank-you message or error, and resetting the form.
 */
export default function EnquiryForm({ children, source = 'General', className = 'form reveal' }) {
  const formRef = useRef(null);
  const messageRef = useRef(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (message || error) {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [message, error]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = formRef.current;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData(form);
      const name = formData.get('name')?.toString() || '';
      const email = formData.get('email')?.toString() || '';
      const phone = formData.get('phone')?.toString() || '';
      const city = formData.get('city')?.toString() || '';
      const pincode = formData.get('pincode')?.toString() || '';
      const pack = formData.get('pack')?.toString() || '';
      const payment = formData.get('payment')?.toString() || '';
      const userMessage = formData.get('message')?.toString() || '';

      // Format message content to consolidate all info for the admin
      let finalMessage = userMessage;
      const details = [];
      if (pack) details.push(`Pack: ${pack}`);
      if (payment) details.push(`Payment: ${payment}`);
      if (city || pincode) {
        const addrStr = [userMessage, city, pincode].filter(Boolean).join(', ');
        details.push(`Address: ${addrStr}`);
      } else if (userMessage) {
        details.push(`Message: ${userMessage}`);
      }
      if (details.length > 0) {
        finalMessage = details.join(' | ');
      } else {
        finalMessage = 'Requested a callback.';
      }

      // Format subject
      const subject = pack ? `Order Callback` : (formData.get('subject')?.toString() || 'General Enquiry');

      await sendEnquiry({
        name,
        email: email ? email.trim().toLowerCase() : undefined,
        phone: phone ? phone.trim() : undefined,
        subject,
        message: finalMessage,
        source,
      });

      const firstName = name.trim().split(' ')[0] || 'there';
      setMessage(`Thank you, ${firstName}! Your enquiry has been noted. Our wellness advisor will call you within 24 hours.`);
      form.reset();
    } catch (err) {
      setError(err.message || 'Could not save your enquiry. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} className={className} noValidate onSubmit={handleSubmit}>
      <div ref={messageRef} className={`form__ok${message ? ' is-shown' : ''}`} role="status" aria-live="polite">
        {message}
      </div>
      <div className={`form__err${error ? ' is-shown' : ''}`} role="alert" aria-live="assertive">
        {error}
      </div>
      <fieldset disabled={loading} style={{ border: 0, padding: 0, margin: 0 }}>
        {children}
      </fieldset>
    </form>
  );
}
