const ExpressJS = require('express');
const { configure } = require('@dwp/govuk-casa');
const path = require('path');

const pages = require('./definitions/pages.js');
const plan = require('./definitions/plan.js');

const application = ({
  sessionStore,
  mountUrl = '/',
  subAppMountUrl = '/',
}) => {
  const { staticRouter, ancillaryRouter, mount } = configure({
    mountUrl,
    views: [
      path.resolve(__dirname, 'views'),
    ],
    session: {
      name: 'myappsessionid',
      secret: 'secret',
      ttl: 60 * 60,
      secure: false,
      store: sessionStore,
    },
    i18n: {
      dirs: [ path.resolve(__dirname, 'locales') ],
      locales: [ 'en' ]
    },
    pages: pages(),
    plan: plan({
      subAppMountUrl,
    }),
  });

  staticRouter.get('/css/application.css', (req, res, next) => {
    res.set('content-type', 'text/css');
    res.send('.govuk-header { background-color: #003078; }');
  });

  // Ensure we start on the first waypoint in the journey
  ancillaryRouter.use(/^\/$/, (req, res, next) => {
    // // TODO: make this a utility function or something so consumers don't have to copy/pasta

    // // In multi-app services, we need to also make sure we pass on any request
    // // params as `casareferrer` may be present, and needed for navigation
    // const searchParams = new URLSearchParams(req.query);
    // const u = new URL(`${mountUrl}start`, 'https://placeholder.test');
    // u.search = searchParams.toString();
    
    // res.redirect(302, `${u.pathname}${u.search}`);
    res.redirect(302, `${mountUrl}start`);
  });

  // Create the sub-app and mount CASA's middleware on it
  const app = ExpressJS();
  mount(app);

  return app;
};

module.exports = application;
