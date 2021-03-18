/**
 * Mark a waypoint as having been viewed, and the user having made an explicit
 * action to pass through it, onto a subsequent page.
 *
 * You may also need to modify the "follow" functions on each of the out-edges
 * leading away from the skipped waypoint, so they understand to allow the skip.
 *
 * It is important that this function overwrites _all_ other data on the
 * specified waypoint.
 *
 * NOTE: All waypoints up to the point of the one being marked must have been
 * visited beforehand, so this middleware must come after journey-rails.
 *
 * Format:
 *  /current-waypoint?skipto=next-waypoint.
 */

const { URL, URLSearchParams } = require('url');
const createLogger = require('../../lib/Logger.js');

module.exports = (mountUrl) => (req, res, next) => {
  const logger = createLogger('page.skip');
  logger.setSessionId(req.session.id);

  req.casa = req.casa || Object.create(null);

  const { skipto } = req.query;
  const { journeyOrigin = { originId: '' } } = req.casa;

  // Validate arguments
  if (skipto === undefined) {
    next();
    return;
  }
  if (typeof skipto !== 'string' || !skipto.match(/^[a-z0-9-]{1,200}$/i)) {
    logger.error('Invalid skip waypoint');
    res.status(400).send('Invalid waypoint');
    return;
  }

  // Inject a special "__skipped__" data item into the waypoint's page data,
  // overwriting all other data therein.
  logger.info('Marking waypoint %s as skipped', req.casa.journeyWaypointId);
  req.casa.journeyContext.clearValidationErrorsForPage(req.casa.journeyWaypointId);
  req.casa.journeyContext.setDataForPage(req.casa.journeyWaypointId, {
    __skipped__: true,
  });

  // Persist changes to session
  req.session.journeyContext = req.casa.journeyContext.toObject();

  // Attach edit flags to the redirect URL, if present
  let redirectUrl = `${mountUrl}/${journeyOrigin.originId || ''}/${skipto}`.replace(/\/+/g, '/');
  if (req.inEditMode) {
    try {
      const urlEditParams = new URLSearchParams({ edit: '', editorigin: req.editOriginUrl });
      const u = new URL(`${redirectUrl}?${urlEditParams}`, 'http://placeholder.test');
      redirectUrl = u.pathname.replace(/^\/+$/, '').replace(/[:.]/g, '').replace(/\/+/g, '/') + u.search;
    } catch (e) {
      req.editOriginUrl = '';
    }
  }

  // Save session and send user on their way
  req.session.save((err) => {
    if (err) {
      logger.error(err);
      next(err);
    } else {
      res.status(302).redirect(redirectUrl);
    }
  });
};
