import { randomBytes } from 'crypto';
import helmet from 'helmet';

export default () => [
  // Only allow certain request methods
  (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      const err = new Error(`Unaccepted request method, "${String(req.method).substr(0, 7)}"`);
      err.code = 'unaccepted_request_method';
      next(err);
    } else {
      next();
    }
  },

  // Prevent caching response in any intermediaries by default, in case it
  // contains sensitive data.
  // The `no-store` setting is to specifically disable the bfcache and prevent
  // possible leakage of information.
  (req, res, next) => {
    res.set('cache-control', 'no-cache, no-store, must-revalidate, private');
    res.set('pragma', 'no-cache');
    res.set('expires', 0);
    res.set('x-robots-tag', 'noindex, nofollow');
    next();
  },

  // Generate nonces ready for use in Content-Security-Policy header and
  // govuk-frontend template. This same none can be used wherever required.
  (req, res, next) => {
    res.locals.cspNonce = randomBytes(16).toString('hex');
    next();
  },

  // Helmet suite of headers
  helmet({
    // Allows GA which is typically used, and a known inline script nonce
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'", 'www.google-analytics.com', 'www.googletagmanager.com', (req, res) => `'nonce-${res.locals.cspNonce}'`],
        'style-src': ["'self'", 'https:', (req, res) => `'nonce-${res.locals.cspNonce}'`],
        'form-action': ["'self'"],
      },
    },

    // // Require referrer to aid navigation
    // referrerPolicy: 'no-referrer, same-origin',
  }),
];
