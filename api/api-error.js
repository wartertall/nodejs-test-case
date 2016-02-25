'use strict';

var deco = require('deco');
var util = require('util');

var RestError = module.exports = deco().inherit(Error);

// ## Private Module Members
// Build a constructor function for an HTTP error, with a custom default message
// that can be overridden.

function buildConstructor(options) {
    var ChildError = deco(function(message) {
        this.status = options.status;
        this.name = options.name;
        // Format the formatted error message.
        this.message = message.message;
        this.code = message.code;
        this.error = message.error;
    });

    ChildError.container(RestError).inherit(RestError);
    ChildError.sanitize(function(message,code,apierror) {
        message = typeof message === 'string' ? message : options.defaultMessage;
        return {
            message: message,
            code: code ? code : 'unknown',
            error: apierror
        };
    });

    ChildError.status = options.status;

    return ChildError;
}

// ## Public Module Members
RestError.BadRequest = buildConstructor({
    defaultMessage: 'Please fix this request and try again',
    status: 400,
    name: 'Bad Request'
});

RestError.Deprecated = buildConstructor({
    defaultMessage: 'One or more deprecated features were used in this request',
    status: 400,
    name: 'Bad Request'
});

RestError.Unauthorized = buildConstructor({
    defaultMessage: 'Unauthorized',
    status: 401,
    name: 'Unauthorized'
});

RestError.BadSyntax = buildConstructor({
    defaultMessage: 'The body of this request was invalid and could not be parsed',
    status: 400,
    name: 'Bad Request'
});

RestError.Forbidden = buildConstructor({
    defaultMessage: 'This action is forbidden',
    status: 403,
    name: 'Forbidden'
});

RestError.NotFound = buildConstructor({
    defaultMessage: 'Nothing matched the requested query',
    status: 404,
    name: 'Not Found'
});

RestError.MethodNotAllowed = buildConstructor({
    defaultMessage: 'The requested HTTP method is not allowed for this resource',
    status: 405,
    name: 'Method Not Allowed'
});

RestError.NotAcceptable = buildConstructor({
    defaultMessage: 'The requested content type could not be provided',
    status: 406,
    name: 'Not Acceptable'
});

RestError.LockConflict = buildConstructor({
    defaultMessage: 'This update conflicts with a previous update',
    status: 409,
    name: 'Conflict'
});

RestError.UnsupportedMediaType = buildConstructor({
    defaultMessage: 'The request\'s content type is unsupported',
    status: 415,
    name: 'Unsupported Media Type'
});

RestError.UnprocessableEntity = deco(function(error) {
    this.message = error.message || 'The request entity could not be processed (422).';
    this.status = 422;
    this.name = error.name || 'Unprocessable Entity';
    this.errors = [];
    this.errors.push(error.errors || error);
});

RestError.UnprocessableEntity.container(RestError).inherit(RestError);
RestError.UnprocessableEntity.prototype.add = function(key, error) {
    this.errors.push(error);
    return this;
};

RestError.Misconfigured = buildConstructor({
    defaultMessage: 'The software is misconfigured',
    status: 500,
    name: 'Internal Server Error'
});

RestError.NotImplemented = buildConstructor({
    defaultMessage: 'The requested functionality is not implemented',
    status: 501,
    name: 'Not Implemented'
});

RestError.status = function() {
    var args = Array.prototype.slice.call(arguments);
    var status = args.shift();
    var errorNames = Object.keys(RestError).filter(function(name) {
        return RestError[name].status === status;
    });

    if(errorNames.length === 0) {
        throw RestError.Misconfigured('Unknown HTTP status code: %s', status);
    }

    var errorType = RestError[errorNames[0]];

    return errorType.apply(errorType, args);
};