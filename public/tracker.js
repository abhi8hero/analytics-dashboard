/**
 * analytics-tracker.js — Embeddable visitor tracking script
 *
 * HOW TO USE:
 *   Add this script to any website you want to track.
 *   The script runs silently in the background.
 *   Visitors will NOT see any banners, popups, or indicators.
 *
 * EMBED (replace YOUR_SUPABASE_URL with your actual Supabase project URL):
 *
 *   <script
 *     src="https://YOUR_ANALYTICS_DASHBOARD_URL/tracker.js"
 *     data-endpoint="https://YOUR_SUPABASE_URL/functions/v1/track"
 *     defer
 *   ></script>
 *
 * ── URL PARAMETER TRACKING ─────────────────────────────────────────────────
 *
 *  Tag any link pointing to your site with UTM parameters to identify
 *  exactly where a visitor came from. Examples:
 *
 *  Newsletter link:
 *    https://yoursite.com/?utm_source=newsletter&utm_medium=email&utm_campaign=june_launch
 *
 *  Twitter / X post:
 *    https://yoursite.com/?utm_source=twitter&utm_medium=social&utm_campaign=product_announcement
 *
 *  Google Ads:
 *    https://yoursite.com/?utm_source=google&utm_medium=cpc&utm_campaign=brand_search&utm_term=your+brand
 *
 *  Partner / affiliate link:
 *    https://yoursite.com/?ref=partner_blog_june
 *
 *  Parameters captured automatically:
 *    utm_source   — WHERE (google, twitter, newsletter, facebook …)
 *    utm_medium   — HOW   (email, cpc, social, organic …)
 *    utm_campaign — WHICH campaign (june_sale, product_launch …)
 *    utm_term     — keyword (paid search only)
 *    utm_content  — A/B variant (banner_a vs banner_b)
 *    ref          — simple shorthand when full UTM is overkill
 *
 * Or inline (recommended for performance):
 *   Copy this file content into a <script> tag on your page.
 *   Set TRACK_ENDPOINT to your Supabase Edge Function URL.
 */

(function () {
  'use strict';

  // ── Configuration ─────────────────────────────────────────────────────────
   const scriptTag = document.querySelector(
    'script[data-endpoint]'
  );

  const TRACK_ENDPOINT =
    scriptTag?.dataset.endpoint ||
    'https://xaghkxxhmhrpqsnovqrh.supabase.co/functions/v1/track';

  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const STORAGE_KEY_FP = '_atrk_fp';
  const STORAGE_KEY_SESS = '_atrk_sess';
  const STORAGE_KEY_SESS_START = '_atrk_ss';
  // UTM params are stored for the whole session so they persist across page navigations
  const STORAGE_KEY_UTM = '_atrk_utm';

  // ── Fingerprint — stable identifier (no PII, no cookies required) ─────────
  function generateFingerprint() {
    const parts = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < parts.length; i++) {
      hash = (Math.imul(31, hash) + parts.charCodeAt(i)) | 0;
    }
    return 'fp_' + Math.abs(hash).toString(36) + '_' + (Date.now() % 1e6).toString(36);
  }

  function getFingerprint() {
    try {
      let fp = localStorage.getItem(STORAGE_KEY_FP);
      if (!fp) {
        fp = generateFingerprint();
        localStorage.setItem(STORAGE_KEY_FP, fp);
      }
      return fp;
    } catch {
      return generateFingerprint();
    }
  }

  // ── Session token — resets after 30 min inactivity ────────────────────────
  function generateToken() {
    return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2);
  }

  function getOrCreateSession() {
    try {
      const now = Date.now();
      const sessToken = sessionStorage.getItem(STORAGE_KEY_SESS);
      const sessStart = parseInt(sessionStorage.getItem(STORAGE_KEY_SESS_START) || '0', 10);

      if (sessToken && now - sessStart < SESSION_TIMEOUT_MS) {
        sessionStorage.setItem(STORAGE_KEY_SESS_START, String(now));
        return sessToken;
      }

      const newToken = generateToken();
      sessionStorage.setItem(STORAGE_KEY_SESS, newToken);
      sessionStorage.setItem(STORAGE_KEY_SESS_START, String(now));
      return newToken;
    } catch {
      return generateToken();
    }
  }

  // ── Device detection ──────────────────────────────────────────────────────
  function detectDevice() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function detectBrowser() {
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return { browser: 'Edge', version: ua.match(/Edg\/([\d.]+)/)?.[1] || '' };
    if (/OPR\/|Opera/.test(ua)) return { browser: 'Opera', version: ua.match(/OPR\/([\d.]+)/)?.[1] || '' };
    if (/Firefox\//.test(ua)) return { browser: 'Firefox', version: ua.match(/Firefox\/([\d.]+)/)?.[1] || '' };
    if (/Chrome\//.test(ua)) return { browser: 'Chrome', version: ua.match(/Chrome\/([\d.]+)/)?.[1] || '' };
    if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return { browser: 'Safari', version: ua.match(/Version\/([\d.]+)/)?.[1] || '' };
    return { browser: 'Unknown', version: '' };
  }

  function detectOS() {
    const ua = navigator.userAgent;
    if (/Windows NT 10/.test(ua)) return { os: 'Windows', version: '10/11' };
    if (/Windows NT/.test(ua)) return { os: 'Windows', version: ua.match(/Windows NT ([\d.]+)/)?.[1] || '' };
    if (/Mac OS X/.test(ua)) return { os: 'macOS', version: ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '' };
    if (/Android/.test(ua)) return { os: 'Android', version: ua.match(/Android ([\d.]+)/)?.[1] || '' };
    if (/iPhone|iPad/.test(ua)) return { os: 'iOS', version: ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '' };
    if (/Linux/.test(ua)) return { os: 'Linux', version: '' };
    return { os: 'Unknown', version: '' };
  }

  // ── Extract referrer domain ────────────────────────────────────────────────
  function getReferrerDomain() {
    try {
      if (!document.referrer) return '';
      return new URL(document.referrer).hostname;
    } catch {
      return '';
    }
  }

  // ── Extract & persist UTM / ref parameters ────────────────────────────────
  function getUtmParams() {
    try {
      const params = new URLSearchParams(window.location.search);

      // If current URL has UTM/ref params, store them for this session
      const fresh = {
        utm_source:   params.get('utm_source')   || null,
        utm_medium:   params.get('utm_medium')   || null,
        utm_campaign: params.get('utm_campaign') || null,
        utm_term:     params.get('utm_term')     || null,
        utm_content:  params.get('utm_content')  || null,
        ref:          params.get('ref')          || null,
      };

      const hasAny = Object.values(fresh).some(Boolean);

      if (hasAny) {
        // Save to sessionStorage so subsequent page views in same session
        // also carry the original attribution
        sessionStorage.setItem(STORAGE_KEY_UTM, JSON.stringify(fresh));
        return fresh;
      }

      // No params on current URL — try to reuse session-stored ones
      const stored = sessionStorage.getItem(STORAGE_KEY_UTM);
      if (stored) {
        try { return JSON.parse(stored); } catch { /* ignore */ }
      }

      return fresh; // all nulls
    } catch {
      return {
        utm_source: null, utm_medium: null, utm_campaign: null,
        utm_term: null, utm_content: null, ref: null,
      };
    }
  }

  // ── Detect site domain (which website the tracker is on) ──────────────────
  function getSiteDomain() {
    try {
      return window.location.hostname;
    } catch {
      return '';
    }
  }

  // ── Send tracking event ───────────────────────────────────────────────────
  function track(pageUrl, pageTitle) {
    const fingerprint = getFingerprint();
    const sessionToken = getOrCreateSession();
    const { browser, version: browserVersion } = detectBrowser();
    const { os, version: osVersion } = detectOS();
    const utm = getUtmParams();

    const payload = {
      fingerprint,
      session_token: sessionToken,
      page_url: pageUrl || window.location.href,
      page_title: pageTitle || document.title || '',
      referrer_url: document.referrer || '',
      referrer_domain: getReferrerDomain(),
      device_type: detectDevice(),
      browser,
      browser_version: browserVersion,
      os,
      os_version: osVersion,
      screen_resolution: screen.width + 'x' + screen.height,
      language: navigator.language || navigator.languages?.[0] || '',
      // UTM attribution
      utm_source:   utm.utm_source,
      utm_medium:   utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_term:     utm.utm_term,
      utm_content:  utm.utm_content,
      ref_param:    utm.ref,
      // Which site is being tracked
      site_domain: getSiteDomain(),
    };

    // Use sendBeacon when available for reliability on page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        TRACK_ENDPOINT,
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } else {
      fetch(TRACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        keepalive: true,
      })
      .then(async (res) => {
        const data = await res.json();
        console.log('TRACK RESPONSE:', data);
      })
      .catch((err) => {
        console.error('TRACK ERROR:', err);
      });
    }
  }

  // ── SPA support — intercept pushState / replaceState ─────────────────────
  function interceptHistory() {
    var _push = history.pushState;
    var _replace = history.replaceState;

    history.pushState = function () {
      _push.apply(history, arguments);
      track(window.location.href, document.title);
    };

    history.replaceState = function () {
      _replace.apply(history, arguments);
    };

    window.addEventListener('popstate', function () {
      track(window.location.href, document.title);
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Ignore bots
    if (/bot|crawler|spider|crawling/i.test(navigator.userAgent)) return;

    // Track current page
    track(window.location.href, document.title);

    // Hook SPA navigation
    interceptHistory();
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
