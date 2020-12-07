const { URL } = require('url');

class BaseTestWaypoint {
  constructor({ mountUrl = '/', waypointId, dom }) {
    this.mountUrl = mountUrl;
    this.waypointId = waypointId; // must include origin, if applicable
    this.dom = dom;
  }

  findField(field) {
    // Convert field to a canonical format - lowerCamelCase
    const fieldKey = field
      .replace(/ ([a-z])/ig, (_, m) => (m.toUpperCase()))
      .replace(/^[A-Z]/, (m) => (m.toLowerCase()));

    // Lookup field selector and use that to find the field in the DOM. Where
    // there is no selector (null / undefined), we try to lookup the field by
    // "name".
    // Where the selector ends with `:eq()`, we can use that to pick 1 element
    // from multiple matching elements
    const fieldSelectors = this.constructor.fieldSelectors();
    const fieldSelector = (fieldSelectors[fieldKey] || `[name="${fieldKey}"]`);

    const eqRegex = /:eq\(([0-9]+)\)$/;
    const eqMatch = fieldSelector.match(eqRegex);
    const eqIndex = eqMatch ? eqMatch[1] : null;

    let $field = this.dom(fieldSelector.replace(eqRegex, ''));
    if (!$field.length) {
      throw new ReferenceError(`Cannot find field with reference "${fieldKey}" on waypoint "${this.waypointId}". Do you need to define a custom class for this waypoint?`)
    }

    // For results that contain more than one element, check if there's a custom
    // `:eq(...)` selector in place
    if ($field.length > 1) {
      if (eqIndex === null) {
        throw new ReferenceError(`Found more than one element (${$field.length}) matching selector "${fieldSelectors[fieldKey]}". You could try using the custom :eq() selector to pinpoint a specific element.`);
      }
      $field = $field.eq(eqIndex);
    } else {
      $field = $field.eq(0);
    }

    return $field;
  }

  static clickField($field) {
    switch ($field.get(0).tagName) {
    case 'input':
      $field.attr('checked', !$field.attr('checked') === true);
      break;
    case 'a':
      return $field.attr('href'); // TODO: need to make absolute somehow!
    case 'option':
      $field.attr('selected', !$field.attr('selected') === true);
      break;
    default:
    }
    return undefined;
  }

  /* ------------- the following should be implemented by the extending class */

  static fieldSelectors() {
    return Object.create(null);
  }

  // After interacting with a page, it _may_ result in the user being transferred
  // away from the current page. In this case, the `nextUrl` result will contain
  // that destination, otherwise it will remain undefined.
  interact({ httpResponse, inputs = {} }) {
    let nextUrl;

    Object.keys(inputs || {}).forEach((field) => {
      const value = inputs[field];
      const $field = this.findField(field);
      switch (value) {
      case 'click()': nextUrl = this.constructor.clickField($field); break;
      case 'select()': $field.attr('checked', true); break;
      case 'deselect()': $field.attr('checked', false); break;
      default:
        $field.val(value);
      }
    });

    // Convert URL to an absolute
    if (nextUrl) {
      const absUrl = new URL(nextUrl || '', httpResponse.request.url);
      nextUrl = absUrl.href.replace(absUrl.origin, '');
    }

    return {
      nextUrl,
    };
  }

  /* eslint-disable-next-line no-unused-vars */
  async progress({ httpResponse, httpAgent }) {
    const formData = this.dom('.casa-journey-form').serialize();
    return httpAgent.post(`${this.mountUrl}${this.waypointId}`).send(formData).then((response) => ({
      nextUrl: (response.headers.location || `${this.mountUrl}${this.waypointId}`),
    }));
  }
}

module.exports = BaseTestWaypoint;
