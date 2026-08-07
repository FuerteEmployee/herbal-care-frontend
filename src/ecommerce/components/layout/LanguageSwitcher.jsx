import React, { useEffect, useRef, useState } from 'react';

/*
 * Header language switcher. The actual translation is done by Google's website
 * translate widget, which we load once and keep hidden — this component is just
 * a styled control over it, so the site keeps its own look instead of Google's
 * grey toolbar.
 *
 * The widget reads the `googtrans` cookie on init, so we write the cookie for
 * persistence across reloads and drive the widget's hidden <select> for the
 * current page (no reload needed). If the widget has not loaded yet — offline,
 * or blocked — we fall back to a reload so it picks the cookie up on boot.
 *
 * On a first visit we also guess the language from the visitor's city/state via
 * IP lookup: Gujarat opens in Gujarati, Punjab in Punjabi, and so on. An
 * explicit pick from the menu is remembered and always wins over the guess.
 */

const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिन्दी', short: 'HI' },
  { code: 'gu', label: 'ગુજરાતી', short: 'GU' },
  { code: 'mr', label: 'मराठी', short: 'MR' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', short: 'PA' },
  { code: 'bn', label: 'বাংলা', short: 'BN' },
  { code: 'ta', label: 'தமிழ்', short: 'TA' },
  { code: 'te', label: 'తెలుగు', short: 'TE' },
  { code: 'kn', label: 'ಕನ್ನಡ', short: 'KN' },
  { code: 'ml', label: 'മലയാളം', short: 'ML' },
];

/* State / UT → language. Anything unmapped stays English. */
const REGION_LANG = {
  gujarat: 'gu',
  'dadraandnagarhavelianddamananddiu': 'gu',
  'damananddiu': 'gu',
  punjab: 'pa',
  chandigarh: 'pa',
  maharashtra: 'mr',
  westbengal: 'bn',
  assam: 'bn',
  tripura: 'bn',
  andamanandnicobarislands: 'bn',
  tamilnadu: 'ta',
  puducherry: 'ta',
  pondicherry: 'ta',
  telangana: 'te',
  andhrapradesh: 'te',
  karnataka: 'kn',
  kerala: 'ml',
  lakshadweep: 'ml',
  delhi: 'hi',
  nationalcapitalterritoryofdelhi: 'hi',
  haryana: 'hi',
  rajasthan: 'hi',
  uttarpradesh: 'hi',
  uttarakhand: 'hi',
  madhyapradesh: 'hi',
  chhattisgarh: 'hi',
  bihar: 'hi',
  jharkhand: 'hi',
  himachalpradesh: 'hi',
  odisha: 'hi',
  orissa: 'hi',
  jammuandkashmir: 'hi',
  ladakh: 'hi',
  goa: 'mr',
};

/*
 * ISO 3166-2:IN subdivision codes, checked before the name table because most
 * providers spell state names inconsistently ("NCT of Delhi", "Orissa",
 * "Tamil Nādu") but agree on the code. Only consulted for Indian IPs — "GA" is
 * Goa here and Georgia in the US.
 */
const SUBDIVISION_LANG = {
  GJ: 'gu', DN: 'gu', DD: 'gu', DH: 'gu',
  PB: 'pa', CH: 'pa',
  MH: 'mr', GA: 'mr',
  WB: 'bn', AS: 'bn', TR: 'bn', AN: 'bn',
  TN: 'ta', PY: 'ta',
  TG: 'te', TS: 'te', AP: 'te',
  KA: 'kn',
  KL: 'ml', LD: 'ml',
  DL: 'hi', HR: 'hi', RJ: 'hi', UP: 'hi', UT: 'hi', UK: 'hi', MP: 'hi',
  CT: 'hi', CG: 'hi', BR: 'hi', JH: 'hi', HP: 'hi', OR: 'hi', OD: 'hi',
  JK: 'hi', LA: 'hi',
};

/* City fallback for the lookups that return a city but a vague region. */
const CITY_LANG = {
  ahmedabad: 'gu', surat: 'gu', vadodara: 'gu', rajkot: 'gu', bhavnagar: 'gu', jamnagar: 'gu',
  gandhinagar: 'gu', junagadh: 'gu', anand: 'gu', bharuch: 'gu',
  amritsar: 'pa', ludhiana: 'pa', jalandhar: 'pa', patiala: 'pa', mohali: 'pa', bathinda: 'pa',
  mumbai: 'mr', bombay: 'mr', pune: 'mr', nagpur: 'mr', nashik: 'mr', thane: 'mr', aurangabad: 'mr',
  kolkata: 'bn', calcutta: 'bn', howrah: 'bn', siliguri: 'bn', guwahati: 'bn',
  chennai: 'ta', madras: 'ta', coimbatore: 'ta', madurai: 'ta', salem: 'ta', tiruchirappalli: 'ta',
  hyderabad: 'te', secunderabad: 'te', vijayawada: 'te', visakhapatnam: 'te', guntur: 'te', warangal: 'te',
  bengaluru: 'kn', bangalore: 'kn', mysuru: 'kn', mysore: 'kn', mangaluru: 'kn', mangalore: 'kn', hubli: 'kn',
  kochi: 'ml', cochin: 'ml', ernakulam: 'ml', thiruvananthapuram: 'ml', trivandrum: 'ml', kozhikode: 'ml', thrissur: 'ml',
  delhi: 'hi', newdelhi: 'hi', noida: 'hi', gurugram: 'hi', gurgaon: 'hi', jaipur: 'hi', lucknow: 'hi',
  kanpur: 'hi', indore: 'hi', bhopal: 'hi', patna: 'hi', varanasi: 'hi', agra: 'hi', ranchi: 'hi', raipur: 'hi',
};

const SCRIPT_ID = 'hg-google-translate';
const HOST_ID = 'hg-gt-host';
const CHOICE_KEY = 'hg_lang_choice';
const GEO_KEY = 'hg_lang_geo';
const GEO_TTL = 7 * 24 * 3600 * 1000;
// A manual pick is respected, but not forever: a visitor who tried a language
// months ago should not be stuck outside auto-detection for good.
const CHOICE_TTL = 30 * 24 * 3600 * 1000;
// All three are asked at once and the first usable answer wins. Asking them in
// sequence meant one blocked or slow provider delayed the whole detection past
// the point the visitor had already read the page in English.
const GEO_ENDPOINTS = [
  'https://get.geojs.io/v1/ip/geo.json',
  'https://ipwho.is/',
  'https://ipapi.co/json/',
];

/*
 * Key for the name tables: lowercase letters only, accents folded first.
 * Several providers return geonames spellings — "Gujarāt", "Mahārāshtra",
 * "Tamil Nādu" — and stripping the accented vowel outright instead of folding
 * it turned "gujarāt" into "gujart", which matched nothing.
 */
function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function isSupported(code) {
  return LANGS.some((l) => l.code === code);
}

function readCookieLang() {
  const match = /(?:^|;\s*)googtrans=([^;]+)/.exec(document.cookie);
  if (!match) return 'en';
  const code = decodeURIComponent(match[1]).split('/').filter(Boolean).pop();
  return isSupported(code) ? code : 'en';
}

function cookieScopes() {
  const scopes = ['', `; domain=${window.location.hostname}`];
  // A dotted domain cookie is what the widget writes itself on real hosts;
  // localhost rejects it, hence the hostname check.
  if (window.location.hostname.includes('.')) scopes.push(`; domain=.${window.location.hostname}`);
  return scopes;
}

function writeCookieLang(code) {
  // Clear every scope first: a host-only cookie and a domain cookie of the same
  // name are two separate cookies, and a stale one left behind is what makes a
  // language look like it "did not change" after a reload.
  cookieScopes().forEach((scope) => {
    document.cookie = `googtrans=; path=/${scope}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
  if (code === 'en') return;
  cookieScopes().forEach((scope) => {
    document.cookie = `googtrans=${encodeURIComponent(`/en/${code}`)}; path=/${scope}`;
  });
}

function readStore(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode — detection just re-runs next visit */
  }
}

function clearStore(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing stored to clear */
  }
}

function ensureWidget() {
  if (document.getElementById(SCRIPT_ID)) return;

  if (!document.getElementById(HOST_ID)) {
    const host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);
  }

  window.hgTranslateInit = function hgTranslateInit() {
    if (!window.google?.translate?.TranslateElement) return;
    // No `includedLanguages` on purpose: restricting the list drops codes the
    // widget then refuses to switch to. Our own menu is what limits the choice.
    new window.google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, HOST_ID);
  };

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = 'https://translate.google.com/translate_a/element.js?cb=hgTranslateInit';
  document.body.appendChild(script);
}

/** The widget builds its <select> a moment after the script lands. */
function waitForCombo(timeout = 8000) {
  return new Promise((resolve) => {
    const existing = document.querySelector('.goog-te-combo');
    if (existing) {
      resolve(existing);
      return;
    }
    const started = Date.now();
    const timer = setInterval(() => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo || Date.now() - started > timeout) {
        clearInterval(timer);
        resolve(combo || null);
      }
    }, 250);
  });
}

function applyToWidget(combo, code) {
  const target = code === 'en' ? '' : code;
  if (combo.value === target) return true;
  if (target && !combo.querySelector(`option[value="${target}"]`)) return false;
  combo.value = target;
  combo.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

/**
 * Make the page actually match `code`. The widget applies the googtrans cookie
 * itself on a cold load, but not always in time (and not at all when the script
 * lands late), so we re-assert it through the select once it exists.
 */
async function ensureApplied(code) {
  const combo = await waitForCombo();
  if (!combo) return false;
  return applyToWidget(combo, code);
}

/** GET + parse JSON, resolving null on any failure so callers can race these. */
async function fetchJson(url, timeout = 5000) {
  const controller = new AbortController();
  const abort = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(abort);
  }
}

/** Region/city/state-code out of one lookup body, whatever the provider calls them. */
function readPlace(data) {
  // ipapi.co answers its rate limit with HTTP 200 and {"error":true}, so a 2xx
  // is not enough — a body without a place means "this provider gave nothing".
  if (!data || data.error || data.success === false) return null;
  const region = data.region || data.region_name || data.state || data.regionName || '';
  const city = data.city || data.cityName || '';
  if (!region && !city) return null;
  return {
    region,
    city,
    // ISO subdivision, as "GJ" or "IN-GJ" depending on the provider.
    regionCode: data.region_code || data.principalSubdivisionCode || '',
    countryCode: data.country_code || data.countryCode || data.country_code2 || '',
  };
}

function placeToLang({ region, city, regionCode, countryCode }) {
  if (String(countryCode || '').toUpperCase().startsWith('IN')) {
    const code = String(regionCode || '').toUpperCase().split('-').pop();
    if (SUBDIVISION_LANG[code]) return SUBDIVISION_LANG[code];
  }
  return REGION_LANG[normalize(region)] || CITY_LANG[normalize(city)] || 'en';
}

/**
 * First usable answer from any of the IP endpoints.
 *
 * Promise.any is not enough on its own: a provider that resolves with a
 * rate-limit body would "win" the race with a useless answer, so each branch
 * rejects unless it actually carries a place.
 */
async function raceIpEndpoints() {
  try {
    return await Promise.any(
      GEO_ENDPOINTS.map(async (url) => {
        const place = readPlace(await fetchJson(url));
        if (!place) throw new Error('no place');
        return place;
      }),
    );
  } catch {
    return null;
  }
}

/** City/state → language, using a cached IP lookup. */
async function detectRegionLang() {
  const cached = readStore(GEO_KEY);
  if (cached && Date.now() - cached.at < GEO_TTL) return cached;

  const place = await raceIpEndpoints();
  if (!place) return null;

  const code = placeToLang(place);
  const result = { code, region: place.region, city: place.city, at: Date.now() };
  // Only a real match is worth remembering for a week. Caching an unmatched
  // result would freeze a visitor on English for seven days because one lookup
  // happened to be vague.
  if (code !== 'en') writeStore(GEO_KEY, result);
  return result;
}

/**
 * Last resort when every IP lookup is blocked (privacy extensions list most of
 * them). The browser locale cannot name a state, but someone whose browser is
 * set to Gujarati wants Gujarati regardless of where they are sitting.
 */
function detectBrowserLang() {
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    const code = String(tag || '').toLowerCase().split('-')[0];
    if (code !== 'en' && isSupported(code)) return { code, region: '', city: '' };
  }
  return null;
}

/**
 * Has the visitor already granted location access on a previous visit?
 *
 * Checked before touching getCurrentPosition so landing on the home page never
 * throws up an unsolicited permission prompt. When they have already said yes,
 * GPS is used because it beats IP lookup; otherwise we fall back to IP
 * silently, and the "Auto" menu item is where an explicit prompt belongs.
 */
async function geolocationAlreadyGranted() {
  if (!navigator.geolocation || !navigator.permissions?.query) return false;
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state === 'granted';
  } catch {
    return false;
  }
}

/** Promise wrapper for getCurrentPosition — resolves null instead of throwing. */
function getCoords(timeout = 8000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => resolve(null),
      // A fix from the last ten minutes is plenty for picking a state, and
      // reusing it skips the several seconds a fresh one costs.
      { timeout, maximumAge: 10 * 60 * 1000, enableHighAccuracy: false },
    );
  });
}

/**
 * Geolocation coords → state/city → language via reverse geocoding.
 *
 * BigDataCloud first: it is built for browser calls, needs no key, and names
 * the state in `principalSubdivision`. Nominatim is the backup — it is an OSM
 * community service that throttles browser traffic hard, so it cannot be the
 * one thing standing between a visitor and their language.
 */
async function detectStateFromCoords(lat, lng) {
  const bdc = await fetchJson(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
  );
  if (bdc?.principalSubdivision || bdc?.city) {
    const region = bdc.principalSubdivision || '';
    const city = bdc.city || bdc.locality || '';
    const code = placeToLang({
      region,
      city,
      regionCode: bdc.principalSubdivisionCode,
      countryCode: bdc.countryCode,
    });
    return { code, region, city };
  }

  const osm = await fetchJson(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
  );
  if (osm?.address) {
    const region = osm.address.state || '';
    const city = osm.address.city || osm.address.town || osm.address.village || '';
    const code = placeToLang({
      region,
      city,
      regionCode: osm.address['ISO3166-2-lvl4'],
      countryCode: osm.address.country_code,
    });
    return { code, region, city };
  }
  return null;
}

/**
 * GPS → language, or null. `allowPrompt` is only true when the visitor picked
 * "Auto" from the menu — that click is the gesture that earns the right to ask
 * for location permission.
 */
async function detectGpsLang({ allowPrompt = false } = {}) {
  if (!allowPrompt && !(await geolocationAlreadyGranted())) return null;
  const coords = await getCoords(allowPrompt ? 10000 : 6000);
  if (!coords) return null;
  const hit = await detectStateFromCoords(coords.latitude, coords.longitude);
  return hit && hit.code !== 'en' ? hit : null;
}

/**
 * Best available guess at the visitor's language, most precise source first.
 * Used by the "Auto" menu item, which can afford to wait for GPS because the
 * visitor asked for it. The automatic path on load does not wait — see below.
 */
async function detectLanguage({ allowPrompt = false } = {}) {
  const gps = await detectGpsLang({ allowPrompt });
  if (gps) return gps;
  const ip = await detectRegionLang();
  if (ip && ip.code !== 'en') return ip;
  return detectBrowserLang() || ip;
}

export default function LanguageSwitcher({ onOpen }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const [autoPlace, setAutoPlace] = useState('');
  // True while the language is whatever detection decided. Turns false the
  // moment someone picks from the menu, and back on if they pick "Auto".
  const [isAuto, setIsAuto] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const rootRef = useRef(null);

  /** Applies a detection result to the page and the UI. */
  function applyDetected(hit) {
    if (!hit || !isSupported(hit.code) || hit.code === 'en') return false;
    setAutoPlace(hit.region || hit.city || '');
    setLang(hit.code);
    writeCookieLang(hit.code);
    ensureApplied(hit.code);
    return true;
  }

  useEffect(() => {
    ensureWidget();

    const cookieLang = readCookieLang();
    const chosen = readStore(CHOICE_KEY);
    let cancelled = false;

    // A recent explicit pick from the menu wins — never second-guess it with
    // geo. Once it is older than CHOICE_TTL we drop it and detect again.
    if (chosen && isSupported(chosen.code) && Date.now() - (chosen.at || 0) < CHOICE_TTL) {
      setIsAuto(false);
      setLang(chosen.code);
      writeCookieLang(chosen.code);
      if (chosen.code !== 'en') ensureApplied(chosen.code);
      return undefined;
    }
    if (chosen) clearStore(CHOICE_KEY);

    setLang(cookieLang);
    if (cookieLang !== 'en') ensureApplied(cookieLang);

    // Two passes, deliberately not one: the IP lookup answers in a few hundred
    // milliseconds, so the page switches language almost immediately. GPS —
    // only when permission was already granted, so this never prompts — can
    // take seconds, and is used afterwards to correct the IP guess when the
    // two disagree (mobile networks routinely geolocate to another state).
    (async () => {
      const ip = await detectRegionLang();
      if (cancelled) return;

      let applied = null;
      if (applyDetected(ip)) {
        applied = ip.code;
      } else {
        const fromBrowser = detectBrowserLang();
        if (applyDetected(fromBrowser)) applied = fromBrowser.code;
      }

      const gps = await detectGpsLang();
      if (!cancelled && gps && gps.code !== applied) applyDetected(gps);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  /**
   * "Auto" — forget the manual pick and detect again. This runs from a click,
   * which is the one moment it is reasonable to ask for location permission,
   * so GPS is allowed here even though the automatic path never prompts.
   */
  async function chooseAuto() {
    setOpen(false);
    clearStore(CHOICE_KEY);
    clearStore(GEO_KEY);
    setIsAuto(true);
    setDetecting(true);
    try {
      const hit = await detectLanguage({ allowPrompt: true });
      if (applyDetected(hit)) return;
      // Nothing recognisable — fall back to English.
      setAutoPlace('');
      if (lang !== 'en') {
        writeCookieLang('en');
        window.location.reload();
      }
    } finally {
      setDetecting(false);
    }
  }

  function choose(code) {
    setOpen(false);
    setIsAuto(false);
    writeStore(CHOICE_KEY, { code, at: Date.now() });
    if (code === lang) return;

    writeCookieLang(code);
    setLang(code);
    setAutoPlace('');

    // Google restores the original text asynchronously; a reload is the only
    // reliable way back to a fully untranslated DOM.
    if (code === 'en') {
      window.location.reload();
      return;
    }

    const combo = document.querySelector('.goog-te-combo');
    if (combo && applyToWidget(combo, code)) return;
    // Widget not ready (or missing that option): the cookie is set, so a single
    // reload lets it translate on boot.
    window.location.reload();
  }

  const active = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <div className={`lang${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="lang__btn notranslate"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change language — current language ${active.label}`}
        onClick={() => {
          // On mobile the burger panel sits directly under the header too —
          // opening one closes the other so they never stack.
          if (!open) onOpen?.();
          setOpen(!open);
        }}
      >
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3.4 9h17.2M3.4 15h17.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span className="lang__code">{active.short}</span>
        <i className="lang__caret" aria-hidden="true" />
      </button>

      <div className="lang__menu notranslate">
        <ul role="listbox" aria-label="Select language">
          <li>
            <button
              type="button"
              role="option"
              aria-selected={isAuto}
              className={isAuto ? 'is-active' : undefined}
              disabled={detecting}
              onClick={chooseAuto}
            >
              <span>{detecting ? 'Detecting…' : 'Auto (my location)'}</span>
              <em>{autoPlace || 'AUTO'}</em>
            </button>
          </li>
          {LANGS.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                role="option"
                aria-selected={item.code === lang}
                className={item.code === lang ? 'is-active' : undefined}
                onClick={() => choose(item.code)}
              >
                <span>{item.label}</span>
                <em>{item.short}</em>
              </button>
            </li>
          ))}
        </ul>
        {autoPlace && isAuto && <p className="lang__auto">Detected {autoPlace}</p>}
      </div>
    </div>
  );
}
