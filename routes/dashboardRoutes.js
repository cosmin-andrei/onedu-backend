const express = require("express");
const router = express.Router();
const authenticateJWT = require("../middlewares/authenticateJWT");
const authorizeAdmin = require("../middlewares/authorizeAdmin");
const { getDonationsCount } = require("../controllers/donationController");
const { getContractsByYear } = require("../controllers/sponsorizareController");
const { getFormulareByYear } = require("../controllers/formulare230Controller");

router.get("/admin", authenticateJWT, authorizeAdmin, async (req, res) => {
    try {
        const donations = await getDonationsCount();
        const sponsors = await getContractsByYear();
        const forms = await getFormulareByYear();

        res.json({ donations, sponsors, forms });
    } catch (error) {
        console.error("Eroare API Dashboard:", error);
        res.status(500).json({ message: "Eroare la încărcarea datelor" });
    }
});

module.exports = router;


module.exports = router;
