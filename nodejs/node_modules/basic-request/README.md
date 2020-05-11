[![Build Status](https://secure.travis-ci.org/alexfernandez/basic-request.png)](http://travis-ci.org/alexfernandez/basic-request)

# basic-request

A very basic library to request a URL and get a result.

## Why Another Request Library?

There are approximately 10000 request packages in npm. This one adds no extra dependencies,
and uses the node.js convention of `function(error, result)` without any added parameters.
No longer will you need to check the status code of the response; basic-request treats all
status codes other than 200 as errors.

As an extra, basic-request follows redirects.

## Usage

Install with npm:

    npm install basic-request

### GET

In your code just require the package:

``` js
var request = require('basic-request');
```

and then use `get()` with a callback in the traditional node.js fashion:

```
request.get('http://httpbin.org/', function(error, body) {
    if (error) {
        return console.error('Could not access httpbin: %s', error);
    }
    console.log('Received %s', body);
});
```

That is it! No wading through responses, parsing status codes or anything else;
basic-response will do that for you. It even follows redirects!

You can see a couple of examples in [the test file](https://github.com/alexfernandez/basic-request/blob/master/test.js).

### PUT and POST

The basic-request package now supports PUT and POST methods,
and will even stringify objects into JSON for you:

``` js
request.post('http://httpbin.org/', {attribute: 'value'}, function(error, body) {
    if (error) {
        return console.error('Could not access httpbin with POST: %s', error);
    }
    console.log('Received %s', body);
});
```

and likewise with `request.put()`.

## *BLOAT ALERT*

A couple of additional features have crept in, using a second (optional) parameter `params`:

    request.get(url, params, callback);

For post and put, it's a third (optional) parameter `params`:

    request.post(url, body, params, callback);
    request.put(url, body, params, callback);

### Retries

Pass a `retries` param to retry requests a number of times:

``` js
request.get('http://httpbin.org/', {retries: 2}, function(error, body) {
    [...]
});
```

### Timeout

Pass a `timeout` param to abort the query after the given number of milliseconds:

``` js
request.get('http://httpbin.org/', {timeout: 1000}, function(error, body) {
    [...]
});
```

### Headers

Pass a `headers` param object to send each key as a header:

``` js
var headers = {
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
};
request.post('http://httpbin.org/', {a: 5}, {headers: headers}, function(error, body) {
    [...]
});
```

### Agent

Pass an `agent` object to use for keep alive:

``` js
request.get('http://httpbin.org/', {agent: new AgentKeepAlive()}, function(error, body) {
    [...]
});
```

By default, no agent is used.
Consider using
[agentkeepalive](https://www.npmjs.com/package/agentkeepalive)
if you need persistent connections,
instead of the default agent.

### Buffer

If `params.buffer` is truthy, then a raw buffer is returned
instead of converting to string first.

## `getResponse()`

In case you want to get the response stream and parse it yourself,
basic-request since 1.2.0 supports `getResponse()`:

    request.getResponse(url, method, body, params, callback);

where `method` can be any HTTP valid method: `GET`, `POST`...
and the `callback` will have the signature `function(error, response)`.
The remaining parameters are as explained above.
`body` and `params` are still optional.
Example:

``` js
request.getResponse('http://httpbin.org/post', POST, {a: 5}, function(error, response) {
    if (error) return console.error('Could not post: %s', error);
    response.pipe(output);
});
```

## License

(The MIT License)

Copyright (c) 2013-2018 Alex Fernández <alexfernandeznpm@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

