'use strict';

require('should');

const config = require('../lib/config.js');

const dateFrom = '2018-07-09T09:00Z';
const dateTo = '2018-07-09T09:30Z';
const query =
  'select eventdate, sessionid, level from demo.ecommerce.data';
const queryId = '1234566789';
const apiKey =
  'fakekey';
const apiSecret =
  'fakesecret';
const apiToken = 'faketoken';
const url = 'http://test.test/test';

describe('Config validation', () => {

  it('parses empty config', () => {
    const opc = config.create({}).parseQuery({});
    config.validate(opc).should.equal(false);
  });

  it('parses valid config', () => {
    const opc = config.create({
      url,
      apiKey,
      apiSecret,
    }).parseQuery({
      dateFrom,
      dateTo,
      query,
    });
    config.validate(opc).should.equal(true);
  });

  it('parses invalid config without url', () => {
    const opc = config.create({
      apiKey,
      apiSecret,
    }).parseQuery({
      dateFrom,
      dateTo,
      queryId: '123456',
    });
    config.validate(opc).should.equal(false);
  });

  it('parses invalid config without auth', () => {
    const opc = config.create({url}).parseQuery({
      dateFrom,
      dateTo,
      queryId: '123456',
    });
    config.validate(opc).should.equal(false);
  });

  it('parses invalid config without query or queryId', () => {
    const opc = config.create({
      url,
      apiKey,
      apiSecret,
    }).parseQuery({
      dateFrom,
      dateTo,
    });
    config.validate(opc).should.equal(false);
  });

  it('parses valid config with query param and apikey', () => {
    const opc = config.create({
      url,
      apiKey,
      apiSecret,
    }).parseQuery({
      dateFrom,
      dateTo,
      query,
    });
    config.validate(opc).should.equal(true);
  });

  it('parses valid config with query param and apiToken', () => {
    const opc = config.create({
      url,
      apiToken,
    }).parseQuery({
      dateFrom,
      dateTo,
      query,
    });
    config.validate(opc).should.equal(true);
  });

  it('parses valid config with queryId param and apikey', () => {
    const opc = config.create({
      url,
      apiKey,
      apiSecret,
    }).parseQuery({
      dateFrom,
      dateTo,
      queryId,
    });
    config.validate(opc).should.equal(true);
  });

  it('parses valid config with queryId param and apiToken', () => {
    const opc = config.create({
      url,
      apiToken,
    }).parseQuery({
      dateFrom,
      dateTo,
      queryId,
    });
    config.validate(opc).should.equal(true);
  });

  it('parses URL that ends with and without /', () => {
    const opc1 = config.create({
      url: 'http://test.test/test/',
      apiToken,
    }).parseQuery({
      dateFrom,
      dateTo,
      queryId,
    });
    const opc2 = config.create({
      url,
      apiToken,
    }).parseQuery({
      dateFrom,
      dateTo,
      queryId,
    });
    opc1.url.should.equal(opc2.url)
  });

  it('parses valid config without dateFrom', () => {
    const opc = config.create({
      url,
      apiKey,
      apiSecret,
    }).parseQuery({
      dateTo,
      queryId,
    });
    config.validate(opc).should.equal(true);
  });

  it('parses valid config without dateTo', () => {
    const opc = config.create({
      url,
      apiKey,
      apiSecret,
    }).parseQuery({
      dateFrom,
      queryId,
    });
    config.validate(opc).should.equal(true);
    (opc.body.to === undefined).should.equal(true);
  });

  it('parses valid config with skip and limit', () => {
    const opc = config.create({
      url,
      apiKey,
      apiSecret,
    }).parseQuery({
      dateFrom,
      dateTo,
      query,
      skip: 10,
      limit: 10,
    });
    config.validate(opc).should.equal(true);
  });

  it('parses valid config with ipAsString', () => {
    const opc = config.create({
      url,
      apiKey,
      apiSecret,
    }).parseQuery({
      dateFrom,
      dateTo,
      query,
      ipAsString: true
    });
    config.validate(opc).should.equal(true);
  });

  it('parses valid config with vaultName', () => {
    const opc = config.create({
      url,
      apiKey,
      apiSecret,
    }).parseQuery({
      dateFrom,
      dateTo,
      query,
      vaultName: 'normal'
    });
    config.validate(opc).should.equal(true);
  });
});
