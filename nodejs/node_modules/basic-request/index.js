'use strict';

/**
 * Simplified http request.
 * (C) 2013-2014 MediaSmart Mobile.
 */

// requires
var http = require('http');
var https = require('https');
var urlLib = require('url');


/**
 * Access a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: optional contents to send, defaults to nothing.
 *	- params: optional additional parameters, currently supported:
 *		- retries: number of times to retry in case of error, default none.
 *		- timeout: time to wait for response in ms.
 *		- headers: object with headers.
 *		- agent: for repeated requests, see https://nodejs.org/api/http.html#http_class_http_agent.
 *		- buffer: if true, return raw buffer
 *	- callback(error, body): error is null only if result is 200.
 *		If there is an error, the body can contain the following attributes:
 *		- statusCode: if status code is not 200.
 *		- readingResponse: if response could not be read.
 */
exports.get = function(url, json, params, callback)
{
	if (typeof params == 'function')
	{
		callback = params;
		params = json;
		json = null;
	}
	send(url, 'GET', json, params, callback);
};

/**
 * Post to a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: optional object to send, can be a JSON string.
 *	- params: same as above.
 *	- callback(error, body): same as above.
 */
exports.post = function(url, json, params, callback)
{
	send(url, 'POST', json, params, callback);
};

/**
 * Put to a URL, send to callback. Parameters:
 *	- url: the URL to access.
 *	- json: optional object to send, can be a JSON string.
 *	- params: same as above.
 *	- callback(error, body): same as above.
 */
exports.put = function(url, json, params, callback)
{
	send(url, 'PUT', json, params, callback);
};

/**
 * Get the response to parse yourself. Parameters:
 *	- url: the URL to access.
 *	- method: string with the method to use ('GET', 'POST'...).
 *	- json: optional object to send, can be a JSON string.
 *	- params: same as above.
 *	- callback(error, body): same as above.
 */
exports.getResponse = function(url, method, json, params, callback)
{
	if (typeof params == 'function')
	{
		callback = params;
		params = {};
	}
	else if (typeof json == 'function')
	{
		callback = json;
		params = {};
		json = null;
	}
	callback = callback || function() {};
	getResponse(url, method, json, params, callback);
}

function send(url, method, json, params, callback)
{
	if (typeof params == 'function')
	{
		callback = params;
		params = {};
	}
	else if (typeof json == 'function')
	{
		callback = json;
		params = {};
		json = null;
	}
	callback = callback || function() {};
	sendWithRetries(params.retries, url, method, json, params, callback);
}

function sendWithRetries(retries, url, method, json, params, callback)
{
	sendWithResponse(url, method, json, params, function(error, result)
	{
		if (error)
		{
			if (retries)
			{
				return sendWithRetries(retries - 1, url, method, json, params, callback);
			}
			return callback(error, result);
		}
		return callback(null, result)
	});
}

function sendWithResponse(url, method, json, params, callback)
{
	getResponse(url, method, json, params, function(error, response)
	{
		if (error) return callback(error, response);
		if (!response)
		{
			return callback(null, null)
		}
		var finished = false;
		var body = [];
		response.on('data', function (chunk)
		{
			body.push(chunk);
		});
		response.on('error', function(error)
		{
			if (finished) return;
			finished = true;
			return callback('Error reading response: ' + error, {readingResponse: true});
		});
		response.on('aborted', function()
		{
			if (finished) return;
			finished = true;
			return callback('Response aborted', {responseAborted: true});
		});
		response.on('end', function()
		{
			if (finished) return;
			finished = true;
			return callback(null, getResult(body, params));
		});
		response.on('close', function()
		{
			if (finished) return;
			finished = true;
			return callback(null, getResult(body, params));
		});

	})
}

function getResponse(url, method, json, params, callback)
{
	var options = urlLib.parse(url);
	options.method = method;
	options.headers = {};
	if (json)
	{
		if (typeof json == 'object')
		{
			params.body = JSON.stringify(json);
			options.headers = {
				'Content-Type': 'application/json',
				'Content-Length': params.body.length,
			};
		}
		else
		{
			params.body = json;
			options.headers = {
				'Content-Type': 'text/plain',
				'Content-Length': params.body.length,
			};
		}
	}
	options.headers['user-agent'] = 'node.js basic-request bot';
	for (var key in params.headers)
	{
		options.headers[key] = params.headers[key];
	}
	options.agent = params.agent || null;
	var finished = false;
	var protocol = http;
	if (options.protocol == 'https:')
	{
		protocol = https;
	}
	var request = protocol.request(options, function(response)
	{
		if (response.statusCode == 301 || response.statusCode == 302)
		{
			// follow redirection
			var location = response.headers.location;
			request.abort();
			return getResponse(location, method, json, params, callback)
		}
		if (response.statusCode == 204)
		{
			if (finished) return;
			finished = true;
			return callback(null, null);
		}
		if (response.statusCode != 200)
		{
			if (finished) return;
			finished = true;
			request.abort();
			return callback('Invalid status code ' + response.statusCode, {statusCode: response.statusCode});
		}
		if (params.timeout)
		{
			response.setTimeout(params.timeout, function()
			{
				if (finished) return;
				finished = true;
				return callback('Timeout while reading response', {responseTimeout: true});
			});
		}
		return callback(null, response);
	});
	request.setNoDelay();
	if (params.timeout)
	{
		request.setTimeout(params.timeout, function()
		{
			if (finished) return;
			finished = true;
			return callback('Timeout while sending request', {requestTimeout: true});
		});
	}
	request.on('error', function(error)
	{
		if (finished) return;
		finished = true;
		return callback('Error sending request: ' + error, {sendingRequest: true});
	});
	request.on('aborted', function()
	{
		if (finished) return;
		finished = true;
		return callback('Request aborted', {requestAborted: true});
	});
	if (params.body)
	{
		request.write(params.body, 'utf8');
	}
	request.end();
}

function getResult(body, params)
{
	var buffer = Buffer.concat(body)
	if (params.buffer) return buffer;
	return String(buffer);
}

// show API if invoked directly
if (__filename == process.argv[1])
{
	console.log('Use in your code as:');
	console.log('  request.get(url, function(error, body) {});');
}

