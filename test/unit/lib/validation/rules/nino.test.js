const chai = require('chai');

const { expect } = chai;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const nino = require('../../../../../lib/validation/rules/nino.js');
const ValidationError = require('../../../../../lib/validation/ValidationError.js');

describe('Validation rule: nino', () => {
  it('should reject with a ValidationError', () => {
    return expect(nino.make().validate('bad-args')).to.eventually.be.rejected.and.be.an.instanceOf(ValidationError);
  });

  it('should resolve for valid NI numbers', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('AA370773A')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject for invalid NI numbers', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('DA123456A')).to.be.rejected);
    queue.push(expect(rule('AO123456B')).to.be.rejected);
    queue.push(expect(rule('QQ123456C')).to.be.rejected);
    queue.push(expect(rule('BG123456A')).to.be.rejected);
    queue.push(expect(rule('AA123456E')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should reject valid NI numbers with spaces by default', () => {
    const queue = [];
    const rule = nino.make().validate;

    queue.push(expect(rule('AA 37 07 73 A')).to.be.rejected);
    queue.push(expect(rule('AA\u002037\u002007\u002073\u0020A')).to.be.rejected);
    queue.push(expect(rule('AA 370773A ')).to.be.rejected);

    return Promise.all(queue);
  });

  it('should accept valid NI numbers with spaces when allowWhitespace is true', () => {
    const rule = nino.make({
      allowWhitespace: true,
    }).validate;
    const queue = [];

    queue.push(expect(rule('AA 370773A ')).to.be.fulfilled);
    queue.push(expect(rule('AA 370  773A')).to.be.fulfilled);
    queue.push(expect(rule('AA\u002037\u002007\u002073\u0020A')).to.be.fulfilled);

    return Promise.all(queue);
  });

  it('should reject valid NI numbers with non standard spaces when allowWhitespace is true', () => {
    const rule = nino.make({
      allowWhitespace: true,
    }).validate;
    return expect(rule('AA\u200237\u200207\u200273\u2002A')).to.be.rejected;
  });

  it('should throw TypeError when allowWhitespace isnt a boolean', () => {
    const rule = nino.make({
      allowWhitespace: 'true',
    }).validate;
    return expect(() => rule('AA 37 07 73 A')).to.throw(TypeError, 'NINO validation rule option "allowWhitespace" must been a boolean. received string');
  });

  describe('sanitise()', () => {
    [
      // type | input | expected output
      ['string', '', ''],
      ['number', 123, '123'],
      ['object', {}, ''],
      ['function', () => {}, ''],
      ['array', [], ''],
      ['boolean', true, ''],
    ].forEach(([type, input, output]) => {
      it(`should coerce ${type} to a string`, () => {
        const sanitise = nino.make().sanitise;

        expect(sanitise(input)).to.equal(output);
      });
    });

    it('should let an undefined value pass through', () => {
      const sanitise = nino.make().sanitise;

      expect(sanitise()).to.be.undefined;
    });
  });
});
