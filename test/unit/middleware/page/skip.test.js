const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');

const { expect } = chai;
chai.use(sinonChai);

const { request, response } = require('../../helpers/express-mocks.js');
const { data: journeyData } = require('../../helpers/journey-mocks.js');
const logger = require('../../helpers/logger-mock.js');

const mwSkip = require('../../../../middleware/page/skip.js');

describe('Middleware: page/skip', () => {
  let stubRequest;
  let stubResponse;
  let stubNext;

  beforeEach(() => {
    stubRequest = request();
    stubRequest.journeyData = journeyData();
    stubRequest.log = logger();
    stubResponse = response();
    stubNext = sinon.stub();
  });

  it('should call next callback if there is no "skip" query', () => {
    const middleware = mwSkip('/');
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubNext).to.be.calledOnceWithExactly();
  });

  it('should send a 400 response if the skip query is an invalid type or format', () => {
    const middleware = mwSkip('/');

    stubRequest.query.skipto = 123;
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubResponse.status).to.be.calledWithExactly(400);
    expect(stubResponse.send).to.be.calledOnceWithExactly('Invalid waypoint');
    stubResponse.status.resetHistory();
    stubResponse.send.resetHistory();

    stubRequest.query.skipto = '$invalid-string$';
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubResponse.status).to.be.calledWithExactly(400);
    expect(stubResponse.send).to.be.calledOnceWithExactly('Invalid waypoint');
    stubResponse.status.resetHistory();
    stubResponse.send.resetHistory();

    stubRequest.query.skipto = (new Array(201).fill('x')).join('');
    middleware(stubRequest, stubResponse, stubNext);
    expect(stubResponse.status).to.be.calledWithExactly(400);
    expect(stubResponse.send).to.be.calledOnceWithExactly('Invalid waypoint');
  });

  it('should overwrite journey data for the current page with __skipped__ flag', () => {
    const middleware = mwSkip('/');
    stubRequest.journeyWaypointId = 'source-waypoint';
    stubRequest.query.skipto = 'target-waypoint';
    middleware(stubRequest, stubResponse, stubNext);

    expect(stubRequest.journeyData.clearValidationErrorsForPage).to.be.calledOnceWithExactly('source-waypoint');
    expect(stubRequest.journeyData.setDataForPage).to.be.calledOnceWithExactly('source-waypoint', {
      __skipped__: true,
    });
  });

  it('should save changes to session', () => {
    const middleware = mwSkip('/test-mount/');
    stubRequest.journeyWaypointId = 'source-waypoint';
    stubRequest.query.skipto = 'target-waypoint';
    stubRequest.journeyData.getData = sinon.stub().returns('test-data');
    middleware(stubRequest, stubResponse, stubNext);

    expect(stubRequest.session.journeyData).to.equal('test-data');
    expect(stubRequest.session.save).to.be.calledOnceWithExactly(sinon.match.func);
  });

  it('should redirect to the target', () => {
    const middleware = mwSkip('/test-mount/');
    stubRequest.journeyWaypointId = 'source-waypoint';
    stubRequest.query.skipto = 'target-waypoint';
    middleware(stubRequest, stubResponse, stubNext);

    expect(stubResponse.status).to.be.calledOnceWithExactly(302);
    expect(stubResponse.redirect).to.be.calledOnceWithExactly('/test-mount/target-waypoint');
  });

  it('should redirect to the target on the same origin as the current node', () => {
    const middleware = mwSkip('/test-mount/');
    stubRequest.journeyWaypointId = 'source-waypoint';
    stubRequest.query.skipto = 'target-waypoint';
    stubRequest.journeyOrigin = { originId: 'test-origin' };
    middleware(stubRequest, stubResponse, stubNext);

    expect(stubResponse.status).to.be.calledOnceWithExactly(302);
    expect(stubResponse.redirect).to.be.calledOnceWithExactly('/test-mount/test-origin/target-waypoint');
  });
});
