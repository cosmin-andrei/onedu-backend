const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const {
    SMARTPAY_BASE_URI,
    SMARTPAY_AUTH_ENDPOINT,
    SMARTPAY_AUTHREFRESH_ENDPOINT,
    SMARTPAY_INIT_PAYMENT_ENDPOINT,
    SMARTPAY_CLIENT_ID,
    SMARTPAY_CERT_PATH,
    SMARTPAY_KEY_PATH
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
        console.log(`Autentificare SmartPay: ${url}`);

        const formData = new FormData();
        formData.append('client_id', SMARTPAY_CLIENT_ID);

        const response = await axios.post(url, formData, {
            httpsAgent,
            headers: {
                ...formData.getHeaders(),
            },
        });

        console.log('Răspuns autentificare:', response.data);

        const {access_token, refresh_token, paymentId} = response.data.result;

        if (!access_token || !refresh_token || !paymentId) {
            console.error('Autentificare SmartPay: Token-uri lipsă în răspuns.');
            throw new Error('Răspuns incomplet de la SmartPay la autentificare.');
        }

        return {access_token, refresh_token, paymentId};
    } catch (error) {
        console.error('Eroare la autentificarea cu SmartPay:', error.response ? error.response.data : error.message);
        throw error;
    }
};

const refreshAccessToken = async (refreshToken) => {
    try {
        const url = `${SMARTPAY_BASE_URI}${SMARTPAY_AUTHREFRESH_ENDPOINT}`;
        console.log(`Reînnoire token SmartPay: ${url}`);

        const formData = new FormData();
        formData.append('refresh_token', refreshToken);

        const response = await axios.post(url, formData, {
            httpsAgent,
            headers: {
                ...formData.getHeaders(),
            },
        });

        console.log('Răspuns reînnoire token:', response.data);

        const { access_token, refresh_token } = response.data.result;

        if (!access_token || !refresh_token) {
            throw new Error('Răspuns incomplet la reînnoirea token-ului.');
        }

        return { access_token, refresh_token };
    } catch (error) {
        console.error('Eroare la reînnoirea token-ului SmartPay:', error.response ? error.response.data : error.message);
        throw error;
    }
};


const initPayment = async (paymentId, banca, amount, tokens, userid, email) => {
    try {
        const url = `${SMARTPAY_BASE_URI}${SMARTPAY_INIT_PAYMENT_ENDPOINT}/${paymentId}`;
        const {access_token} = tokens;

        const response = await axios.post(
            url,
            {
                "amount": amount,
                "creditorIban": "RO49BTRLRONCRT0CO9563601",
                "creditorName": "Asociatia ONedu",
                "debtorBank": banca,
                "details": "Donatie online prin onedu.ro",
                "psuIntermediarId": userid,
                "psuEmail": email,
                "redirectURL": "https://onedu.ro/donatie-succes",
                "ibanOptimization": true,
                "TCAccepted": true,
            },
            {
                httpsAgent,
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.warn('Token expirat. Încerc reînnoirea...');
            const newTokens = await refreshAccessToken(tokens.refresh_token);
            return initPayment(paymentId, banca, amount, newTokens, userid);
        }
        console.error(`Eroare la inițializarea plății pentru banca ${banca}:`, error.response ? error.response.data : error.message);
        throw error;
    }
};

const initRecurringPayment = async (paymentId, banca, amount, tokens, userId, email) => {
    try {
        const url = `${SMARTPAY_BASE_URI}${SMARTPAY_INIT_PAYMENT_ENDPOINT}/${paymentId}`;
        const {access_token} = tokens;

        const today = new Date();
        const startDate = today.toISOString().split('T')[0];

        const response = await axios.post(
            url,
            {
                "amount": amount,
                "creditorIban": "RO49BTRLRONCRT0CO9563601",
                "creditorName": "Asociatia ONedu",
                "debtorBank": banca,
                "details": "Donatie lunara online prin onedu.ro",
                "psuIntermediarId": userId,
                "psuEmail": email,
                "redirectURL": "https://onedu.ro/donatie-succes",
                "ibanOptimization": true,
                "TCAccepted": true,
                "startDate": startDate,
                "Frequency": "Monthly",
                "dayOfExecution": 15,
            },
            {
                httpsAgent,
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.warn('Token expirat. Încerc reînnoirea...');
            const newTokens = await refreshAccessToken(tokens.refresh_token);
            return initPayment(paymentId, banca, amount, newTokens, userId);
        }
        console.error(`Eroare la inițializarea plății pentru banca ${banca}:`, error.response ? error.response.data : error.message);
        throw error;
    }

}

const checkPaymentStatus = async (paymentId) => {
    try {
        const url = `${SMARTPAY_BASE_URI}${SMARTPAY_INIT_PAYMENT_ENDPOINT}/${paymentId}`;
        const response = await axios.get(url, {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Eroare la verificarea stării plății:', error.response ? error.response.data : error.message);
        throw error;
    }
};

module.exports = {
    authenticate,
    refreshAccessToken,
    initPayment,
    checkPaymentStatus,
    initRecurringPayment
};
