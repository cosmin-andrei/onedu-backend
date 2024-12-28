// backend/controllers/formulare230Controller.js

const {Formulare230} = require('../models');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs-extra');
const path = require('path');
const {PDFDocument, rgb} = require('pdf-lib');
const multer = require('multer');

// Configurarea multer pentru upload-ul fișierelor
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/');
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({storage: storage});

/**
 * Middleware pentru upload-ul semnăturii
 */
exports.uploadSignature = upload.single('semnatura');

/**
 * Controller pentru trimiterea și procesarea formularului 230
 */
exports.submitForm = async (req, res) => {
    const {
        nume,
        prenume,
        initiala_tatalui,
        cnp,
        email,
        telefon,
        strada,
        numarul,
        bloc,
        scara,
        etaj,
        apartament,
        judet,
        oras,
        perioada_redirectionare
    } = req.body;

    // Dacă există fișierul de semnătură, preia path-ul
    const semnatura = req.file ? req.file.path : null;

    try {
        // Salvează datele în baza de date
        const formular = await Formulare230.create({
            nume,
            prenume,
            initiala_tatalui,
            cnp,
            email,
            telefon,
            strada,
            numarul,
            bloc,
            scara,
            etaj,
            apartament,
            judet,
            oras,
            perioada_redirectionare,
            semnatura
        });

        // Generează PDF-ul formularului
        const pdfPath = await generateFormPDF(formular);

        // Generează Certificatul de Donator
        const certificatePath = await generateCertificatePDF(formular);

        // Trimite email către utilizator
        await sendEmail(
            email,
            'Formular 230 - Confirmare și Certificat Donator',
            `<p>Bună ${prenume} ${nume},</p>
            <p>Mulțumim pentru completarea Formularului 230. Atașat vei găsi formularul tău și certificatul de donator.</p>
            <p>Cu respect,<br>Echipa OnEdu</p>`,
            [pdfPath, certificatePath]
        );

        // Trimite email către formular230@onedu.ro
        await sendEmail(
            'formulare230@onedu.ro',
            'Formular 230 - Nouă Completare',
            `<p>Un nou formular 230 a fost completat de ${prenume} ${nume} (${email}).</p>`,
            [pdfPath]
        );

        res.status(201).json({
            message: 'Formularul a fost trimis și email-urile au fost trimise cu succes.'
        });
    } catch (error) {
        console.error('Eroare la trimiterea formularului:', error);
        res.status(500).json({
            message: 'A apărut o eroare la trimiterea formularului.'
        });
    }
};



/**
 * Funcție pentru generarea PDF-ului formularului folosind pdf-lib
 * @param {Object} formular - Obiectul Formularului230
 * @returns {Promise<string>} - Calea către fișierul PDF generat
 */
const generateFormPDF = async (formular) => {
    try {
        // Asigură valori implicite pentru câmpurile opționale
        const {
            telefon = "N/A",
            bloc = "N/A",
            scara = "N/A",
            etaj = "N/A",
            apartament = "N/A",
            nume = "N/A",
            prenume = "N/A",
            initiala_tatalui = "N/A",
            cnp = "N/A",
            email = "N/A",
            strada = "N/A",
            numarul = "N/A",
            judet = "N/A",
            oras = "N/A",
            perioda_redirectionare = "N/A",
            data_completarii = new Date()
        } = formular;

        // Încarcă PDF-ul template
        const templatePath = path.join(__dirname, '../templates/formular230_template.pdf');
        const existingPdfBytes = await fs.readFile(templatePath);

        // Încarcă PDF-ul în pdf-lib
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Embed fonturi (opțional)
        const helveticaFont = await pdfDoc.embedFont('Helvetica');

        // Selectează prima pagină
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Definirea coordonatelor pentru fiecare câmp (ajustează valorile în funcție de template)
        const fields = {
            nume: { x: 150, y: 750 },
            prenume: { x: 150, y: 730 },
            initiala_tatalui: { x: 150, y: 710 },
            cnp: { x: 150, y: 690 },
            email: { x: 150, y: 670 },
            telefon: { x: 150, y: 650 },
            strada: { x: 150, y: 630 },
            numarul: { x: 150, y: 610 },
            bloc: { x: 150, y: 590 },
            scara: { x: 150, y: 570 },
            etaj: { x: 150, y: 550 },
            apartament: { x: 150, y: 530 },
            judet: { x: 150, y: 510 },
            oras: { x: 150, y: 490 },
            perioda_redirectionare: { x: 150, y: 470 },
            data_completarii: { x: 150, y: 450 },
            semnatura: { x: 400, y: 200 } // Poziția semnăturii
        };

        // Adaugă textul la coordonatele specificate
        firstPage.drawText(nume, { x: fields.nume.x, y: fields.nume.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(prenume, { x: fields.prenume.x, y: fields.prenume.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(initiala_tatalui, { x: fields.initiala_tatalui.x, y: fields.initiala_tatalui.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(cnp, { x: fields.cnp.x, y: fields.cnp.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(email, { x: fields.email.x, y: fields.email.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(telefon, { x: fields.telefon.x, y: fields.telefon.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(strada, { x: fields.strada.x, y: fields.strada.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(numarul, { x: fields.numarul.x, y: fields.numarul.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(bloc, { x: fields.bloc.x, y: fields.bloc.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(scara, { x: fields.scara.x, y: fields.scara.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(etaj, { x: fields.etaj.x, y: fields.etaj.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(apartament, { x: fields.apartament.x, y: fields.apartament.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(judet, { x: fields.judet.x, y: fields.judet.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(oras, { x: fields.oras.x, y: fields.oras.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(perioda_redirectionare, { x: fields.perioda_redirectionare.x, y: fields.perioda_redirectionare.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });
        firstPage.drawText(data_completarii.toDateString(), { x: fields.data_completarii.x, y: fields.data_completarii.y, size: 12, font: helveticaFont, color: rgb(0, 0, 0) });

        // Adaugă semnătura dacă există
        if (formular.semnatura) {
            const signatureImageBytes = await fs.readFile(formular.semnatura);
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
            const signatureDims = signatureImage.scale(0.3);

            firstPage.drawImage(signatureImage, {
                x: fields.semnatura.x,
                y: fields.semnatura.y,
                width: signatureDims.width,
                height: signatureDims.height,
            });
        }

        // Salvează PDF-ul
        const pdfBytes = await pdfDoc.save();

        const pdfDir = path.join(__dirname, '../pdfs');
        await fs.ensureDir(pdfDir);
        const pdfPath = path.join(pdfDir, `formular230_${formular.id}.pdf`);
        await fs.writeFile(pdfPath, pdfBytes);

        return pdfPath;
    } catch (error) {
        console.error('Eroare la generarea PDF-ului formularului:', error);
        throw error;
    }
};



/**
 * Funcție pentru generarea Certificatului de Donator folosind pdf-lib
 * @param {Object} formular - Obiectul Formularului230
 * @returns {Promise<string>} - Calea către fișierul PDF generat
 */
const generateCertificatePDF = async (formular) => {
    try {
        // Încarcă PDF-ul template pentru certificat (presupunem că există un template separat)
        const templatePath = path.join(__dirname, '../templates/certificate_template.pdf');
        const existingPdfBytes = await fs.readFile(templatePath);

        // Încarcă PDF-ul în pdf-lib
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // Embed fonturi (opțional)
        const helveticaFont = await pdfDoc.embedFont('Helvetica');

        // Selectează prima pagină
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Definirea coordonatelor pentru fiecare câmp (ajustează valorile în funcție de template)
        const fields = {
            numePrenume: {x: 150, y: 750},
            initiala_tatalui: {x: 150, y: 730}, // Nou câmp adăugat
            contributie: {x: 150, y: 710},
            data: {x: 150, y: 690},
            semnatura: {x: 400, y: 200} // Poziția semnăturii
        };

        // Adaugă textul la coordonatele specificate
        firstPage.drawText(`${formular.nume} ${formular.prenume}`, {
            x: fields.numePrenume.x,
            y: fields.numePrenume.y,
            size: 14,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`Inițiala tatălui: ${formular.initiala_tatalui}`, { // Adaugă inițiala tatălui
            x: fields.initiala_tatalui.x,
            y: fields.initiala_tatalui.y,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`A contribuit cu 3.5% din donațiile primite.`, {
            x: fields.contributie.x,
            y: fields.contributie.y,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(new Date().toDateString(), {
            x: fields.data.x,
            y: fields.data.y,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        // Adaugă semnătura dacă există
        if (formular.semnatura) {
            const signatureImageBytes = await fs.readFile(formular.semnatura);
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes); // Utilizează embedJpg pentru JPG
            const signatureDims = signatureImage.scale(0.3); // Ajustează scala

            firstPage.drawImage(signatureImage, {
                x: fields.semnatura.x,
                y: fields.semnatura.y,
                width: signatureDims.width,
                height: signatureDims.height,
            });
        }

        // Salvează PDF-ul
        const pdfBytes = await pdfDoc.save();

        const pdfDir = path.join(__dirname, '../pdfs');
        await fs.ensureDir(pdfDir);
        const certificatePath = path.join(pdfDir, `certificate_${formular.id}.pdf`);
        await fs.writeFile(certificatePath, pdfBytes);

        return certificatePath;
    } catch (error) {
        console.error('Eroare la generarea certificatului:', error);
        throw error;
    }
};
