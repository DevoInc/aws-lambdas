'use strict';

const HmacSHA256 = require('crypto-js/hmac-sha256');

const PATH_QUERY = '/query';

module.exports = {
  create: credentials => new Config(credentials),
  validate,
};

/**
 * Class to manage config values.
 */
class Config {

  /**
   * Create the config.
   * @param {Object} credentials Configuration object including:
   *  - url: server URL.
   *  - apiToken: used for authorization.
   *  - token: equivalent to apiToken, deprecated.
   *  - apiKey: used for authorization. Requires apiSecret.
   *  - apiSecret: used to sign the request. Requires apiKey.
   */
  constructor(credentials) {
    this._mustSign = false;
    if (credentials.url && credentials.url.endsWith('/')) {
      this._url = credentials.url.substring(0, credentials.url.length - 1);
    } else {
      this._url = credentials.url
    }
    if (credentials.apiToken || credentials.token) {
      this._apiToken = credentials.apiToken || credentials.token;
    } else if (credentials.apiKey) {
      this._mustSign = true;
      this._apiKey = credentials.apiKey;
      this._apiSecret = credentials.apiSecret;
    }
  }

  /**
   * Parse a set of options for a query invocation.
   *
   * @param {Object} the options object, including:
   *  - path: path for the endpoint. Default is '/query'.
   *  - method: HTTP method. Default is 'POST'.
   *  - format: response format, can be one of: json, msgpack, xls, csv, tsv
   *  or raw.
   *    Default is 'json'.
   *  - dateFrom: starting date in ISO-8601 format, default current date.
   *  - dateTo: ending date in ISO-8601 format, optional.
   *  - skip: elements of the query to skip, optional.
   *  - limit: elements of the query to return, optional.
   *  - vaultName: optional query priority: "low", "normal" or "high".
   *  - query: string with query to send.
   *  - queryId: alternatively identifies a particular query in the server.
   *  - destination: optional destination for the data.
   *  - ipAsString: optional return ip as string.
   * @param format optionally the format to use, has precedence on
   * options.format.
   * @return an object with parsed url, body and headers.
   */
  parseQuery(options, format) {
    const opc = {
      url: this._url + (options.path || PATH_QUERY),
      method: options.method || 'POST',
      headers : {
        'Content-Type': 'application/json'
      },
      body: {
        from: getDate(options.dateFrom || new Date()),
        mode: {
          type: format || options.format || 'json',
        },
      },
    };
    const to = getDate(options.dateTo);
    if (to) opc.body.to = to;
    if (options.skip) opc.body.skip = options.skip
    if (options.limit) opc.body.limit = options.limit
    if (options.vaultName) opc.body.vaultName = options.vaultName
    if (options.query) {
      opc.body.query = options.query;
    } else {
      opc.body.queryId = options.queryId;
    }
    if (options.ipAsString) opc.body.ipAsString = options.ipAsString;
    if (options.destination) {
      opc.body.destination = {
        type: options.destination.type,
        params: options.destination.params,
      }
    }
    this._generateSignature(opc);
    return opc;
  }

  /**
   * Parse a set of options for a GET invocation.
   *
   * @param {String} path Path for the endpoint.
   * @return an object with parsed url and headers.
   */
  parseGet(path) {
    const opc = {
      url: this._url + path,
      method: 'GET',
      headers : {
        'Content-Type': 'application/json'
      },
    };
    this._generateSignature(opc);
    return opc;
  }

  /**
   * Create apiKey&apiSecret signature using body parameters,
   * or just add apiToken to headers.
   */
  _generateSignature(opc) {
    if (this._apiToken) {
      opc.headers.Authorization = `${this._apiToken}`;
    }
    if (this._mustSign) {
      let timestamp = new Date().getTime();
      opc.headers['x-logtrust-apikey'] = this._apiKey;
      opc.headers['x-logtrust-timestamp'] = timestamp;
      const body = opc.body ? JSON.stringify(opc.body) : ''
      const signMsg = this._apiKey + body + timestamp;
      opc.headers['x-logtrust-sign'] =
        HmacSHA256(signMsg, this._apiSecret).toString();
    }
  }
}

/**
 * Validate if generated options object is OK.
 * @returns {boolean}
 */
function validate(opc) {
  if (opc.url.startsWith('undefined')) {
    console.error('Invalid URL')
    return false
  }
  if (!opc.body) {
    console.error('No body')
    return false
  }
  const headers = opc.headers;
  if (!headers['x-logtrust-apikey'] && !headers.Authorization) {
    console.error('No authorization')
    return false
  }
  if (!opc.body.queryId && !opc.body.query) {
    console.error('Missing query or query ID')
    return false
  }
  if (!opc.body.from) {
    console.error('Missing "from" date; please use ISO-8601 format')
    return false
  }
  return true
}

/**
 * Returns a date for API payload
 * @param date
 * @returns {*}
 */
function getDate(date) {
  //Infinite Query (Not set date)
  if (!date || date === -1 || date === '-1') {
    return null;
  } else {
    return parseDateToEpoch(date);
  }
}

/**
 * Converts a date into epoch (milliseconds)
 * @param date
 * @returns {number}
 */
function parseDateToEpoch(date) {
  return parseInt(new Date(date).getTime() / 1000);
}
