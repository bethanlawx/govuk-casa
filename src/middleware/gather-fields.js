// Gather the field data from `req.body` into the current JourneyContext
// - Store in the current session
// - Update the user's journey context with the new data
// - Remove validation date of JourneyContext so it can re-evaluted

import JourneyContext from '../lib/JourneyContext.js';

/**
 * @access private
 * @typedef {import('../lib/field').PageField} PageField
 */

/**
 * Gather the field data from `req.body` into the current JourneyContext
 * - Store in the current session
 * - Update the user's journey context with the new data
 * - Remove validation date of JourneyContext so it can re-evaluted
 *
 * @param {object} obj Options
 * @param {string} obj.waypoint Waypoint
 * @param {PageField[]} [obj.fields=[]] Fields
 * @returns {Array} Array of middleware
 */
export default ({
  waypoint,
  fields = [],
}) => [
  (req, res, next) => {
    // Store a copy of the journey context before modifying it. This is useful
    // for any comparison work that may be done in subseqent middleware.
    req.casa.archivedJourneyContext = JourneyContext.fromContext(req.casa.journeyContext);

    // Ignore data for any non-persistent fields
    // ESLint disabled as `fields`, `i` and `name` are dev-controlled
    /* eslint-disable security/detect-object-injection */
    const persistentBody = Object.create(null);
    for (let i = 0, l = fields.length; i < l; i++) {
      if (fields[i].meta.persist && fields[i].getValue(req.body) !== undefined) {
        persistentBody[fields[i].name] = fields[i].getValue(req.body);
      }
    }
    /* eslint-enable security/detect-object-injection */

    // Update data and validation context in the current request, and store
    req.casa.journeyContext.setDataForPage(waypoint, persistentBody);
    req.casa.journeyContext.removeValidationStateForPage(waypoint);
    JourneyContext.putContext(req.session, req.casa.journeyContext);

    next();
  },
];
