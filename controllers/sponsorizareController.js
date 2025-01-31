const {Companie, UserCompanie, Sponsorizari} = require('../models');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const sendEmail = require('../utils/sendEmail');
require('nodemailer');

const sendEmailWithTemplate = async (to, subject, templatePath, placeholders, attachments) => {
    try {
        if (!fs.existsSync(templatePath)) {
            throw new Error('Template file not found');
        }

        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        Object.keys(placeholders).forEach((key) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(regex, placeholders[key]);
        });

        await sendEmail(to, subject, htmlContent, attachments);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

exports.createSponsorship = async (req, res) => {
    const {
        CUI,
        numeCompanie,
        nrRegComertului,
        adresa,
        oras,
        judet,
        banca,
        IBAN,
        persoaneContact,
        suma,
        data,
    } = req.body;

    try {
        // Validarea intrărilor
        if (!CUI || !numeCompanie || !suma || !data) {
            return res.status(400).json({error: 'Date incomplete. CUI, numeCompanie, suma și data sunt obligatorii.'});
        }

        // Găsește sau creează compania
        let companie = await Companie.findByPk(CUI);
        if (!companie) {
            companie = await Companie.create({
                CUI,
                nume: numeCompanie,
                nrRegComertului,
                adresa,
                oras,
                judet,
                banca,
                IBAN,
            });
        }

        if (!companie) {
            return res.status(400).json({error: 'Compania nu a putut fi creată sau găsită.'});
        }

        for (const persoana of persoaneContact) {
            const {
                forma_adresare,
                prenume,
                nume,
                email,
                telefon,
                pozitia,
                esteReprezentantLegal,
            } = persoana;

            let user = await UserCompanie.findOne({where: {CUI, email}});
            if (!user) {
                user = await UserCompanie.create({
                    forma_adresare,
                    prenume,
                    nume,
                    email,
                    telefon,
                    pozitia,
                    CUI,
                });
            }

            if (esteReprezentantLegal) {
                companie.idReprezentantLegal = user.id;
                await companie.save();
            }
        }

        await Sponsorizari.create({
            idCompanie: CUI,
            data,
            suma,
        });

        // Procesare șablon de contract
        const templatePath = path.join(__dirname, '../templates/contract_template.docx');
        if (!fs.existsSync(templatePath)) {
            return res.status(500).json({error: 'Fișierul șablon nu a fost găsit.'});
        }

        const templateContent = fs.readFileSync(templatePath, 'binary');
        let doc;

        try {
            const zip = new PizZip(templateContent);
            doc = new Docxtemplater(zip);
        } catch (error) {
            console.error('Eroare la procesarea șablonului:', error);
            return res.status(500).json({error: 'Eroare la procesarea șablonului DOCX.'});
        }

        const reprezentantLegal = await UserCompanie.findByPk(companie.idReprezentantLegal);

        if (!reprezentantLegal) {
            return res.status(400).json({error: 'Reprezentantul legal nu a fost găsit.'});
        }

        try {
            doc.compile();
            doc.render({
                dataIncheiere: data,
                CUI,
                numeCompanie,
                nrRegComertului,
                adresa,
                oras,
                judet,
                banca,
                IBAN,
                prenumeReprezentant: reprezentantLegal.prenume,
                numeReprezentant: reprezentantLegal.nume,
                functiaReprezentant: reprezentantLegal.pozitia,
                email: reprezentantLegal.email,
                telefon: reprezentantLegal.telefon,
                prenumeSemnatar: reprezentantLegal.prenume,
                numeSemnatar: reprezentantLegal.nume,
                functiaSemnatar: reprezentantLegal.pozitia,
                suma: suma || '_________',
                data,
            });
        } catch (error) {
            console.error('Eroare la randarea șablonului:', error);
            return res.status(500).json({error: 'Eroare la randarea șablonului DOCX.'});
        }

        const outputPath = path.join(__dirname, `../pdfs/contracts/2025/contract_${CUI}_${data}.docx`);
        fs.writeFileSync(outputPath, doc.getZip().generate({type: 'nodebuffer'}));

        await sendEmailWithTemplate(
            reprezentantLegal.email,
            'Contractul de sponsorizare - Asociația ONedu',
            path.join(__dirname, '../emails/sponsorizare.html'),
            {
                formaAdresare: reprezentantLegal.forma_adresare,
                prenumeReprezentant: reprezentantLegal.prenume,
                numeReprezentant: reprezentantLegal.nume,
                numeCompanie,
            },
            [
                {
                    filename: 'contract_AsociatiaONedu.docx',
                    path: outputPath,
                },
            ]
        );

        res.status(200).json({message: 'Sponsorizarea a fost înregistrată cu succes.'});
    } catch (error) {
        console.error('Eroare la crearea sponsorizării:', error);
        res.status(500).json({error: 'A apărut o eroare.'});
    }
};

exports.getAllContracts = async (req, res) => {
    try {
        const contracts = await Sponsorizari.findAll({
            include: [
                {
                    model: Companie,
                    as: 'companie', // Alias definit în relație
                    attributes: ['nume', 'CUI', 'adresa'],
                    include: [
                        {
                            model: UserCompanie,
                            as: 'reprezentantLegal', // Alias definit în relație
                            attributes: ['prenume', 'nume', 'email'],
                        },
                    ],
                },
            ],
        });

        res.status(200).json(contracts);
    } catch (error) {
        console.error('Eroare la obținerea contractelor:', error);
        res.status(500).json({ message: 'A apărut o eroare la obținerea contractelor.' });
    }
};


exports.getContractById = async (req, res) => {
    const { id } = req.params;
    try {
        const contract = await Sponsorizari.findByPk(id, {
            include: [
                {
                    model: Companie,
                    as: 'companie', // Alias definit în relație
                    attributes: ['nume', 'CUI', 'adresa'],
                    include: [
                        {
                            model: UserCompanie,
                            as: 'reprezentantLegal', // Alias pentru reprezentant legal
                            attributes: ['prenume', 'nume', 'email'],
                        },
                    ],
                },
            ],
        });

        if (!contract) {
            return res.status(404).json({ message: 'Contractul nu a fost găsit.' });
        }

        res.status(200).json(contract);
    } catch (error) {
        console.error('Eroare la obținerea contractului:', error);
        res.status(500).json({ message: 'A apărut o eroare la obținerea contractului.' });
    }
};

const { Parser } = require('json2csv');

exports.exportContracts = async (req, res) => {
    try {
        const contracts = await Sponsorizari.findAll({
            include: [
                {
                    model: Companie,
                    as: 'companie', // Alias definit în relație
                    attributes: ['nume', 'CUI'],
                },
            ],
            attributes: ['id', 'data', 'suma'],
        });

        const jsonContracts = contracts.map(contract => ({
            id: contract.id,
            data: contract.data,
            suma: contract.suma,
            companie: contract.companie ? contract.companie.nume : 'N/A',
            CUI: contract.companie ? contract.companie.CUI : 'N/A',
        }));

        const json2csvParser = new Parser();
        const csvData = json2csvParser.parse(jsonContracts);

        res.header('Content-Type', 'text/csv');
        res.attachment('contracts.csv');
        res.send(csvData);
    } catch (error) {
        console.error('Eroare la exportul contractelor:', error);
        res.status(500).json({ message: 'A apărut o eroare la exportul contractelor.' });
    }
};
