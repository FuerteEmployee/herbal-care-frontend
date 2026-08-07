import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';

export default function PageHead({ breadcrumbs, title, subtitle }) {
  return (
    <section className="pagehead">
      <div className="pagehead__in wrap">
        <div className="crumbs">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.label}>
              {index > 0 && ' / '}
              {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
            </Fragment>
          ))}
        </div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}
