const { Formulare230 } = require('../models');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs-extra');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const multer = require('multer');

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

const upload = multer({ storage: storage });
exports.uploadSignature = upload.single('semnatura');

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

    const semnatura = req.file ? req.file.path : null;

    try {
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

        const pdfPath = await generateFormPDF(formular);
        const certificatePath = await generateCertificatePDF(formular);

        const emailTemplatePath = path.join(__dirname, '../emails/formular230.html');
        const htmlContent = await fs.readFile(emailTemplatePath, 'utf-8');

        const personalizedHtml = htmlContent
            .replace('{{prenume}}', prenume);

        await sendEmail(
            email,
            'Formular 230 - Confirmare și Certificat Donator',
            personalizedHtml,
            [
                { path: pdfPath, filename: `formular230_${formular.prenume}.pdf` },
                { path: certificatePath, filename: `certificate_${formular.prenume}_${formular.nume}.pdf` }
            ]
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

function drawCNPdigitsBoxes(page, cnp, boxes, font, size = 14) {
    if (!cnp) return;
    const digits = cnp.split('');

    digits.forEach((digit, index) => {
        if (index < boxes.length) {
            page.drawText(digit, {
                x: boxes[index].x,
                y: boxes[index].y,
                size,
                font,
                color: rgb(0, 0, 0),
            });
        }
    });
}

const generateFormPDF = async (formular) => {
    try {
        const templatePath = path.join(__dirname, '../templates/formular230_template.pdf');
        const existingPdfBytes = await fs.readFile(templatePath);

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const helveticaFont = await pdfDoc.embedFont('Helvetica');

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        const cnpBoxes = [
            { x: 334, y: 671 }, // cifra 1
            { x: 353, y: 671 }, // cifra 2
            { x: 370, y: 671 }, // cifra 3
            { x: 389, y: 671 }, // cifra 4
            { x: 406, y: 671 }, // cifra 5
            { x: 425, y: 671 }, // cifra 6
            { x: 444, y: 671 }, // cifra 7
            { x: 462, y: 671 }, // cifra 8
            { x: 482, y: 671 }, // cifra 9
            { x: 500, y: 671 }, // cifra 10
            { x: 518, y: 671 }, // cifra 11
            { x: 537, y: 671 }, // cifra 12
            { x: 558, y: 671 }, // cifra 13
        ];

        const coordinates = {
            nume:              { x:  70, y: 680 },
            initiala_tatalui:  { x: 295, y: 681 },
            prenume:           { x:  70, y: 658 },
            email:             { x: 370, y: 648 },
            telefon:           { x: 370, y: 620 },
            strada:            { x:  70, y: 638 },
            numarul:           { x: 287, y: 638 },
            bloc:              { x:  50, y: 615 },
            scara:             { x: 110, y: 615 },
            etaj:              { x: 147, y: 615 },
            apartament:        { x: 183, y: 615 },
            judet:             { x: 270, y: 615 },
            oras:              { x:  70, y: 593 },
            perioada_redirectionare: { x: 325, y: 428 },
        };

        firstPage.drawText(formular.nume || '', {
            x: coordinates.nume.x,
            y: coordinates.nume.y,
            size: 14,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(formular.prenume || '', {
            x: coordinates.prenume.x,
            y: coordinates.prenume.y,
            size: 14,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(formular.initiala_tatalui || '', {
            x: coordinates.initiala_tatalui.x,
            y: coordinates.initiala_tatalui.y,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        if (formular.cnp) {
            drawCNPdigitsBoxes(
                firstPage,
                formular.cnp,
                cnpBoxes,
                helveticaFont,
                14
            );
        }

        firstPage.drawText(formular.email || '', {
            x: coordinates.email.x,
            y: coordinates.email.y,
            size: 14,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
        firstPage.drawText(formular.telefon || '', {
            x: coordinates.telefon.x,
            y: coordinates.telefon.y,
            size: 14,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        // Adresa
        firstPage.drawText(formular.strada || '', {
            x: coordinates.strada.x,
            y: coordinates.strada.y,
            size: 13,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
        firstPage.drawText(formular.numarul || '', {
            x: coordinates.numarul.x,
            y: coordinates.numarul.y,
            size: 14,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
        firstPage.drawText(formular.bloc || '', {
            x: coordinates.bloc.x,
            y: coordinates.bloc.y,
            size: 13,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
        firstPage.drawText(formular.scara || '', {
            x: coordinates.scara.x,
            y: coordinates.scara.y,
            size: 13,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
        firstPage.drawText(formular.etaj || '', {
            x: coordinates.etaj.x,
            y: coordinates.etaj.y,
            size: 13,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
        firstPage.drawText(formular.apartament || '', {
            x: coordinates.apartament.x,
            y: coordinates.apartament.y,
            size: 13,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
        firstPage.drawText(formular.judet || '', {
            x: coordinates.judet.x,
            y: coordinates.judet.y,
            size: 14,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });
        firstPage.drawText(formular.oras || '', {
            x: coordinates.oras.x,
            y: coordinates.oras.y,
            size: 14,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        // Bifa opțională (2 ani)
        if (formular.perioada_redirectionare === '2') {
            firstPage.drawText('X', {
                x: coordinates.perioada_redirectionare.x,
                y: coordinates.perioada_redirectionare.y,
                size: 12,
                font: helveticaFont,
                color: rgb(0, 0, 0)
            });
        }

        // Salvăm PDF-ul final
        const pdfBytes = await pdfDoc.save();
        const pdfDir = path.join(__dirname, '../pdfs/formular230/2025');
        await fs.ensureDir(pdfDir);
        const pdfPath = path.join(pdfDir, `formular230_${formular.prenume}.pdf`);
        await fs.writeFile(pdfPath, pdfBytes);

        return pdfPath;
    } catch (error) {
        console.error('Eroare la generarea PDF-ului formularului:', error);
        throw error;
    }
};

const generateCertificatePDF = async (formular) => {
    try {
        const templatePath = path.join(__dirname, '../templates/certificat_formular230.pdf');
        const existingPdfBytes = await fs.readFile(templatePath);

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const helveticaFont = await pdfDoc.embedFont('Helvetica');

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        const coordinates = {
            numePrenume: { x: 415, y: 250 },
        };

        firstPage.drawText(`${formular.prenume} ${formular.nume}` || '', {
            x: coordinates.numePrenume.x,
            y: coordinates.numePrenume.y,
            size: 40,
            font: helveticaFont,
            color: rgb(0, 0, 0),
        });

        const pdfBytes = await pdfDoc.save();

        const pdfDir = path.join(__dirname, '../pdfs/formular230/2025/certificate');
        await fs.ensureDir(pdfDir);
        const certificatePath = path.join(pdfDir, `certificate_${formular.prenume}_${formular.nume}.pdf`);
        await fs.writeFile(certificatePath, pdfBytes);

        return certificatePath;
    } catch (error) {
        console.error('Eroare la generarea certificatului:', error);
        throw error;
    }
};

exports.getAllFormulare = async (req, res) => {
    try {
        const formulare = await Formulare230.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] },
        });
        res.status(200).json(formulare);
    } catch (error) {
        console.error('Eroare la obținerea formularelor:', error);
        res.status(500).json({ message: 'A apărut o eroare la obținerea formularelor.' });
    }
};

exports.getFormularById = async (req, res) => {
    const { id } = req.params;
    try {
        const formular = await Formulare230.findByPk(id);
        if (!formular) {
            return res.status(404).json({ message: 'Formularul nu a fost găsit.' });
        }
        res.status(200).json(formular);
    } catch (error) {
        console.error('Eroare la obținerea formularului:', error);
        res.status(500).json({ message: 'A apărut o eroare la obținerea formularului.' });
    }
};

const { Parser } = require('json2csv');

exports.exportFormulare = async (req, res) => {
    try {
        const formulare = await Formulare230.findAll({
            attributes: { exclude: ['createdAt', 'updatedAt'] },
        });

        const jsonFormulare = formulare.map((formular) => formular.toJSON());

        const json2csvParser = new Parser();
        const csvData = json2csvParser.parse(jsonFormulare);

        res.header('Content-Type', 'text/csv');
        res.attachment('formulare230.csv');
        res.send(csvData);
    } catch (error) {
        console.error('Eroare la exportul formularelor:', error);
        res.status(500).json({ message: 'A apărut o eroare la exportul formularelor.' });
    }
};


