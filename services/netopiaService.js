'use strict';

const MobilPay = require('mobilpay-card');
const fs = require('fs');
const dotenv = require('dotenv');
const {post} = require("axios");
const {string} = require("joi");
dotenv.config();

const mobilPay = new MobilPay(process.env.MOBILPAY_SIGNATURE);

const path = require('path');
const publicKeyPath = path.join(__dirname, '../certs/sandbox.2JN8-R7WK-4QOY-ORHY-4XLI.public.cer');
const publicKey = fs.readFileSync(publicKeyPath);

console.log('Public key path:', process.env.MOBILPAY_PUBLIC_KEY_PATH);
mobilPay.setPublicKey(publicKey);

function startPaymentService(startRequest) {
    const {config, order} = startRequest;

    mobilPay.setClientBillingData({
        firstName: order.billing.firstName,
        lastName: order.billing.lastName,
        county: order.billing.state || '',
        city: order.billing.city || '',
        address: order.billing.details || '',
        email: order.billing.email,
        phone: order.billing.phone,
    });

    mobilPay.setPaymentData({
        orderId: order.orderID,
        amount: order.amount,
        currency: order.currency || 'RON',
        details: order.description,
        confirmUrl: config.redirectUrl,
        returnUrl: config.redirectUrl,
    });

    return mobilPay.buildRequest(config.sandbox);
}

function verifyNetopiaStatus(env_key, data) {
    mobilPay.setPrivateKeyFromPath(process.env.MOBILPAY_PRIVATE_KEY_PATH);
    let response = mobilPay.validatePayment(env_key, data);

    if (response.error) {
        return false;
    }

    switch (response.action) {
        case 'confirmed':
            return 'confirmed';
        case 'paid':
            return 'paid';
        case 'paid_pending':
            return 'paid_pending';
        case 'confirmed_pending':
            return 'confirmed_pending';
    }


}

module.exports = {startPaymentService, verifyNetopiaStatus};