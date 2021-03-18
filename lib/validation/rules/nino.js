/**
 * UK National Insurance number.
 *
 * Bound attributes:
 *   string|object errorMsg = Error message to use on validation failure
 *   boolean allowWhitespace = will permit input values that contain spaces.
 *
 * Ref:
 * https://en.wikipedia.org/wiki/National_Insurance_number#Format
 * https://design-system.service.gov.uk/patterns/national-insurance-numbers/
 *
 * @param  {string} value NI number
 * @returns {Promise} Promise
 */
const ValidationError = require('../ValidationError.js');

function nino(value, dataContext = {}) {
  if (typeof this.allowWhitespace !== 'undefined' && typeof this.allowWhitespace !== 'boolean') {
    throw new TypeError(`NINO validation rule option "allowWhitespace" must been a boolean. received ${typeof this.allowWhitespace}`);
  }
  const valid = typeof value === 'string'
    && value.replace((typeof this.allowWhitespace !== 'undefined' && this.allowWhitespace) ? /\u0020/g : '', '')
      .match(/^(?!BG|GB|NK|KN|TN|NT|ZZ)[ABCEGHJ-PRSTW-Z][ABCEGHJ-NPRSTW-Z]\d{6}[A-D]$/i);

  const errorMsg = this.errorMsg || {
    inline: 'validation:rule.nino.inline',
    summary: 'validation:rule.nino.summary',
  };

  return valid ? Promise.resolve() : Promise.reject(ValidationError.make({
    errorMsg,
    dataContext,
  }));
}

module.exports = nino;
