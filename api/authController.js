'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var jwt = require( 'jsonwebtoken' );
var config = require( '../config' );
var apiError = require('./api-error');

exports.index = function( req, res ) {
    // find the user
    User.findOne( {
        name: req.body.name
    }, function( err, user ) {

        if ( err ) {
            throw {
                status:500,
                message:"Has error in processing data.",
                error:err
            }
        }

        if ( !user ) {
            return res.render('login',{
                loginError:'Authentication failed. User not found.'
            });
        }

        user.comparePassword( req.body.password, function( err, isMatch ) {
            if ( err ) {
                throw {
                    status:500,
                    message:"Has error in processing data.",
                    error:err
                }
            }

            if(!isMatch) {
                return res.render('login',{
                    loginError:'Authentication failed. Wrong password.'
                });
            }

            // if user is found and password is right
            // create a token
            var token = jwt.sign( user.toJSON(), config.secret, {
                expiresIn: 1440 // expires in 24 hours
            } );

            res.locals.hasLogedIn = true;
            res.locals.token = token;

            // return the information including token as JSON
            res.render( 'transactions', {
                title: 'Transactions Page',
                user:user
            } );
        } );
    } );
};

exports.register = function( req, res ) {
    if(!req.body || !req.body.name || !req.body.password){
        return res.render('login',{
            registerError:'Register failed. Missing data.'
        });
    }

    // find the user
    User.findOne( {
        name: req.body.name
    }, function( err, user ) {
        if ( err ) {
            throw {
                status:500,
                message:"Has error in processing data.",
                error:err
            }
        }

        if ( user ) {
            return res.render('login',{
                registerError:'Register failed. Username is not free'
            });
        }
        user = new User( {
            name: req.body.name,
            password: req.body.password
        } );

        user.save( function( err ) {
            if ( err ) {
                throw {
                    status:500,
                    message:"Has error in processing data.",
                    error:err
                }
            }

            // if user is found and password is right
            // create a token
            var token = jwt.sign( user.toJSON(), config.secret, {
                expiresIn: 1440 // expires in 24 hours
            } );

            res.locals.hasLogedIn = true;
            res.locals.token = token;

            // return the information including token as JSON
            res.render( 'transactions', {
                title: 'Transactions Page',
                user:user
            } );
        } );

    } );
};
