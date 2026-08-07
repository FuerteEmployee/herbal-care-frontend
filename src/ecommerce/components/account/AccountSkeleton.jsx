import React from 'react';

/*
 * Placeholder for the account dashboard while the stored token is exchanged
 * for a profile.
 *
 * It mirrors the real `.dash` grid — sidebar rail on the left, panel on the
 * right — so when the data lands the layout stays put instead of the page
 * jumping. That is the whole point of a skeleton over a spinner.
 */

function Line({ width }) {
  return <div className="skel skel--line" style={width ? { '--w': width } : undefined} />;
}

export default function AccountSkeleton() {
  return (
    <div className="dash" aria-hidden="true">
      <aside className="dash__side">
        {/* Matches the signed-in header: avatar, name, email on the green fill. */}
        <div className="dash__me">
          <div className="skel skel--on-dark" style={{ width: 68, height: 68, borderRadius: '50%', margin: '0 auto 14px' }} />
          <div className="skel skel--line skel--on-dark" style={{ '--w': '60%', margin: '0 auto 8px' }} />
          <div className="skel skel--line skel--on-dark" style={{ '--w': '80%', margin: '0 auto' }} />
        </div>
        <nav className="dnav">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ padding: '16px 22px', borderBottom: '1px solid var(--green-line)' }}>
              <Line width={`${70 - i * 6}%`} />
            </div>
          ))}
        </nav>
      </aside>

      <section className="panel">
        <div className="panel__head">
          <div style={{ width: '100%' }}>
            <div className="skel skel--title" style={{ marginBottom: 10 }} />
            <Line width="55%" />
          </div>
        </div>

        {/* Three order-card shapes — the panel that opens by default. */}
        <div className="skel-stack" style={{ gap: 18, marginTop: 22 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--green-line)',
                borderRadius: 'var(--radius-sm)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div className="skel-row" style={{ justifyContent: 'space-between' }}>
                <Line width="130px" />
                <div className="skel skel--pill" />
              </div>
              <div className="skel-row">
                <div className="skel skel--thumb" />
                <div className="skel-stack" style={{ flex: 1 }}>
                  <Line width="70%" />
                  <Line width="40%" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
