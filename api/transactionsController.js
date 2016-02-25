'use strict';

var mongoose = require('mongoose');
var Transactions = mongoose.model('Transactions');
var User = mongoose.model('User');
var config = require( '../config' );
var Stripe = require( 'stripe' )( config.stripeApiKey );
var async = require( 'async' );
var mongoose = require( 'mongoose' );

exports.index = function( req, res, next ) {
    if ( req.body ) {
        var transaction = new Transactions( {
            name: req.body.name
        } );
        transaction.save( function( err, trans ) {
            if ( err ) {
                return console.log( err );
            }
            res.status( 200 ).end();
        } );
    }
};

exports.createTransaction = function( req, res, next ) {
    if(!req.body.amount || !req.body.currency){
        return res.status(400).json({
            message: "Data error. Please fill all data before submit."
        });
    }

    // get user
    User.findById(req.decoded._id, function(err, user){
        if ( err ) {
            return res.status(500).json({
                message: "Has error in processing data."
            });
        }

        if(!user){
            return res.status(404).json({
                message: "Has error in processing data."
            });
        }

        if(!user.stripeCustomerId && !req.body.token){
            return callback("Stripe card token doesn't found.");
        }

        // create customer stripe card
        async.waterfall([
            function(callback){
                if(user.stripeCustomerId){
                    return callback();
                }

                // create stripe customer
                Stripe.customers.create({
                    description: 'Customer '+user.name,
                    metadata:{
                        user:user._id.toHexString(),
                        username:user.name
                    },
                    source: req.body.token
                }, function(err, customer) {
                    if(err){
                        return callback(err);
                    }
                    // update user
                    user.stripeCustomerId = customer.id;
                    // save user
                    user.save(callback);
                });
            }
        ], function(err, results){
            if ( err ) {
                return res.status(500).json({
                    message: "Has error in processing data."
                });
            }

            // create charge
            Stripe.charges.create( {
                amount: req.body.amount,
                currency: req.body.currency,
                customer: user.stripeCustomerId,
                description: 'Charge for test@example.com'
            }, function(err, charge){
                if ( err ) {
                    return res.status(400).json({
                        message: "Has error in processing data."
                    });
                }

                var transaction = new Transactions( {
                    transactionId: charge.id,
                    amount: charge.amount,
                    created: charge.created,
                    currency: charge.currency,
                    description: charge.description,
                    paid: charge.paid,
                    sourceId: charge.source.id
                } );

                transaction.save( function( err ) {
                    if ( err ) {
                        return res.status(500).json({
                            message: "Has error in processing data."
                        });
                    }

                    res.json({
                        message: 'Payment is created.'
                    })
                });
            });
        });
    });
};
