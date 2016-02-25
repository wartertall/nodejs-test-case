'use strict';

/*global Stripe:true*/
/*global $form:true*/

//set Public key for Stripe payments
Stripe.setPublishableKey( 'pk_test_D0mSU2LrI6paBL26CFem13ow' );
var isSubmit = false;
var isSubmitting = false;
$( document ).ready( function() {
    var createTransactionFrm = $("#createTransactionFrm");

    createTransactionFrm.validate({
        rules:{
            amount:"required",
            currency:"required",
            cardnumber:"required",
            cvc:"required",
            'card-expiry-month':"required",
            'card-expiry-year':"required"
        },
        submitHandler:function(form){
            if(isSubmitting){
                return ;
            }
            isSubmitting = true;

            console.log( 'ok' );

            var paymentSuccessNtfE = $('.payment-created');
            var paymentErrorNtfE = $('.payment-errors');

            paymentSuccessNtfE.addClass("hide");
            paymentErrorNtfE.addClass("hide");

            if ( !isSubmit ) {
                var reqCreateTransactions = function(data){
                    $.ajax( {
                        url: '/createtransaction',
                        type: 'POST',
                        headers: {
                            'x-access-token': authenticateToken
                        },
                        data: data
                    }).done(function(response){
                        paymentSuccessNtfE.removeClass('hide');
                        isSubmit = true;
                        isSubmitting = false;
                    }).error(function(response){
                        paymentErrorNtfE.text(response.responseJSON.message || "Has error in processing data.").removeClass('hide');
                        isSubmitting = false;
                    });
                };

                if(hasCardSaved){
                    reqCreateTransactions({
                        amount: $( '#amount' ).val(),
                        currency: $( '#currency' ).val()
                    });
                }else{
                    Stripe.card.createToken( {
                        number: $( '.card-number' ).val(),
                        cvc: $( '.card-cvc' ).val(),
                        exp_month: $( '.card-expiry-month' ).val(),
                        exp_year: $( '.card-expiry-year' ).val()
                    }, function( status, response ) {
                        if ( response.error ) {
                            // Show the errors on the form
                            paymentErrorNtfE.text( response.error.message ).removeClass('hide');
                            isSubmitting = false;
                            return ;
                        }

                        // response contains id and card, which contains additional card details
                        var stripeToken = response.id;
                        // Insert the token into the form so it gets submitted to the server
                        createTransactionFrm.find('[name=stripeToken]').remove();
                        createTransactionFrm.append($('<input type="hidden" name="stripeToken" />' ).val(stripeToken));
                        // and submit
                        reqCreateTransactions({
                            amount: $( '#amount' ).val(),
                            currency: $( '#currency' ).val(),
                            token: stripeToken
                        });
                    } );
                }
            }
        }
    });
} );
