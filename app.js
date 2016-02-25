'use strict';

var express = require( 'express' );
var path = require( 'path' );
//var favicon = require('serve-favicon');
var logger = require( 'morgan' );
var fs = require( 'fs' );
var cookieParser = require( 'cookie-parser' );
var bodyParser = require( 'body-parser' );
var expressLayouts = require( 'express-ejs-layouts' );
var jwt = require( 'jsonwebtoken' );
var config = require( './config' );

var app = express();

// view engine setup
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'ejs' );

app.set( 'layout', 'layout' );

//secret jwt
app.set( 'superSecret', config.secret ); // secret variable

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use( logger( 'dev' ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( {
    extended: false
}));
app.use( cookieParser() );
app.use( express.static( path.join( __dirname, 'public' ) ) );
app.use( expressLayouts );

var mongoDB = require( './config/mongoDB.js' );

// Bootstrap models
var des_models_path = __dirname + '/models';
fs.readdirSync(des_models_path).forEach(function (file) {
    console.log(des_models_path + '/' + file);
    if (~file.indexOf('.js')) require(des_models_path + '/' + file);
});

app.use(function(req, res, next){
    res.locals.navActiveIndex = 1;
    res.locals.hasLogedIn = false;
    next();
});


var routes = require( './routes/index' );
var users = require( './routes/users' );

app.use( '/', routes );
app.use( '/users', users );

// catch 404 and forward to error handler
app.use( function( req, res, next ) {
    var err = new Error( 'Not Found' );
    err.status = 404;
    next( err );
} );

// error handlers

// development error handler
// will print stacktrace
if ( app.get( 'env' ) === 'development' ) {
    app.use( function( err, req, res, next ) {
        res.status( err.status || 500 );
        res.render( 'error', {
            message: err.message,
            error: err
        } );
    } );
}

// production error handler
// no stacktraces leaked to user
app.use( function( err, req, res, next ) {
    res.status( err.status || 500 );
    res.render( 'error', {
        message: err.message,
        error: {}
    } );
} );


// start app
var port = (process.env.PORT || config.listenPort || 3000);
app.listen(port);

console.log('\n\nWelcome to Stacked!\n\nPlease go to http://localhost:' + port + '\n\n');

module.exports = app;
