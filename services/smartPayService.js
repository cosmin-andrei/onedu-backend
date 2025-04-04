const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();
const logger = require('../utils/logger');

const {
    SMARTPAY_BASE_URI,
    SMARTPAY_AUTH_ENDPOINT,
    SMARTPAY_AUTHREFRESH_ENDPOINT,
    SMARTPAY_INIT_PAYMENT_ENDPOINT,
    SMARTPAY_CLIENT_ID,
    SMARTPAY_CERT_PATH,
    SMARTPAY_KEY_PATH,
    SMARTPAY_CHECK_PAYMENT_ENDPOINT
} = process.env;

const certPath = path.resolve(__dirname, '../', SMARTPAY_CERT_PATH);
const keyPath = path.resolve(__dirname, '../', SMARTPAY_KEY_PATH);

if (!fs.existsSync(certPath)) {
    console.error(`Fișierul de certificat SmartPay nu a fost găsit: ${certPath}`);
    process.exit(1);
}

if (!fs.existsSync(keyPath)) {
    console.error(`Fișierul de cheie SmartPay nu a fost găsit: ${keyPath}`);
    process.exit(1);
}

const httpsAgent = new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    rejectUnauthorized: true,
});

const FormData = require('form-data');

const authenticate = async () => {
    try {
        const url = `${SMARTPAY_BASE_URI}${SMARTPAY_AUTH_ENDPOINT}`;
        const formData = new FormData();
        formData.append('client_id', SMARTPAY_CLIENT_ID);

        const config = {
            httpsAgent,
            headers: formData.getHeaders(),
        };

        const response = await axios.post(url, formData, config);

        const {access_token, refresh_token, paymentId} = response.data.result || {};

        logger.info(`Autentificare SmartPay: access_token=${access_token}, refresh_token=${refresh_token}, paymentId=${paymentId}`);

        if (!access_token || !refresh_token || !paymentId) {
            return Promise.reject(new Error('Răspuns incomplet de la SmartPay la autentificare.'));
        }

        return {access_token, refresh_token, paymentId};
    } catch (error) {
        console.error('Eroare la autentificare SmartPay:', error.response?.data || error.message);
        return Promise.reject(error);
    }
};

const refreshAccessToken = async (access_token, refresh_token) => {
    try {
        const url = `${SMARTPAY_BASE_URI}${SMARTPAY_AUTHREFRESH_ENDPOINT}`;
        const formData = new FormData();

        logger.info(`Reînnoire token SmartPay cu refresh token: ${refresh_token}`);
        logger.info(`Reînnoire token SmartPay cu access token: ${access_token}`);
        logger.info(`Reînnoire token SmartPay cu client id: ${SMARTPAY_CLIENT_ID}`);

        formData.append('refresh_token', refresh_token);
        formData.append('client_id', SMARTPAY_CLIENT_ID);

        logger.info('Reînnoire token SmartPay...');
        logger.info(`Form data: ${JSON.stringify(formData)}`);

        const config = {
            httpsAgent,
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${access_token}`,
            },
        };

        const response = await axios.post(url, formData, config);

        logger.info(`Răspuns la reînnoirea token-ului: ${JSON.stringify(response.data)}`);

        const {access_token: newAccessToken, refresh_token: newRefreshToken} = response.data.result || {};

        if (!newAccessToken || !newRefreshToken) {
            return Promise.reject(new Error('Răspuns incomplet la reînnoirea token-ului.'));
        }

        logger.info(`Token reînnoit cu succes: ${newAccessToken}`);

        return {access_token: newAccessToken, refresh_token: newRefreshToken};
    } catch (error) {
        logger.error('Eroare la reînnoirea token-ului SmartPay:', error.response?.data || error.message);
        return Promise.reject(error);
    }
};


const initPaymentRequest = async (paymentId, banca, amount, tokens, userId, email, isRecurring = false) => {
    try {
        const url = `${SMARTPAY_BASE_URI}${SMARTPAY_INIT_PAYMENT_ENDPOINT}/${paymentId}`;
        const {access_token} = tokens;

        const payload = {
            amount,
            creditorIban: "RO49BTRLRONCRT0CO9563601",
            creditorName: "Asociatia ONedu",
            debtorBank: banca,
            details: isRecurring ? "Donatie lunara online prin onedu.ro" : "Donatie online prin onedu.ro",
            psuIntermediarId: userId,
            psuEmail: email,
            redirectURL: "http://localhost:3000/doneaza/status/smartpay",
            ibanOptimization: true,
            TCAccepted: true,
        };

        logger.info(`Payload pentru inițializarea plății: ${JSON.stringify(payload)}`);

        if (isRecurring) {
            const today = new Date();
            payload.startDate = today.toISOString().split('T')[0];
            payload.Frequency = "Monthly";
            payload.dayOfExecution = 15;
        }

        const config = {
            httpsAgent,
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        };

        const response = await axios.post(url, payload, config);

        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            try {
                const newTokens = await refreshAccessToken(tokens.refresh_token);
                return initPaymentRequest(paymentId, banca, amount, newTokens, userId, email, isRecurring);
            } catch (refreshError) {
                console.error('Eroare la reînnoirea token-ului și la reluarea plății:', refreshError.message);
                return Promise.reject(refreshError);
            }
        }
        console.error(`Eroare la inițializarea plății pentru banca ${banca}:`, error.response?.data || error.message);
        return Promise.reject(error);
    }
};

const initPayment = async (paymentId, banca, amount, tokens, userId, email) => {
    return initPaymentRequest(paymentId, banca, amount, tokens, userId, email, false);
};

const initRecurringPayment = async (paymentId, banca, amount, tokens, userId, email) => {
    return initPaymentRequest(paymentId, banca, amount, tokens, userId, email, true);
};

const checkPaymentStatus = async (paymentId, access_token, refresh_token) => {
    logger.info(`Verificare starea plății cu id-ul: ${paymentId}`);

    try {
        const url = `${SMARTPAY_BASE_URI}${SMARTPAY_CHECK_PAYMENT_ENDPOINT}/${paymentId}`;
        const config = {
            httpsAgent,
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        };

        const response = await axios.get(url, config);
        logger.info(`Răspuns la verificarea stării plății: ${JSON.stringify(response.data)}`);

        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            try {
                logger.info("Token expirat, încerc reînnoirea...");

                await refreshAccessToken(access_token, refresh_token);

                return checkPaymentStatus(paymentId, access_token, refresh_token);
            } catch (refreshError) {
                logger.error('Eroare la reînnoirea token-ului și la reluarea verificării:', refreshError.message);
                return Promise.reject(refreshError);
            }
        }

        logger.error('Eroare la verificarea stării plății:', error.response?.data || error.message);
        return Promise.reject(error);
    }
};


module.exports = {
    authenticate,
    refreshAccessToken,
    initPayment,
    checkPaymentStatus,
    initRecurringPayment
};
