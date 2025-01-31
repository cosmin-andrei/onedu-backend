// import fs from "fs";
// import {convertDocxToPdf} from "docx-to-pdf";
//
// export const convertPDF = async (inputPath, outputPath) => {
//     try {
//         if (!fs.existsSync(inputPath)) {
//             throw new Error("Input file does not exist.");
//         }
//
//         // Perform the conversion
//         await convertDocxToPdf(inputPath, outputPath);
//
//         if (!fs.existsSync(outputPath)) {
//             throw new Error("PDF conversion failed.");
//         }
//
//         console.log(`Converted ${inputPath} to ${outputPath}`);
//     } catch (error) {
//         console.error("Error converting file:", error.message);
//         throw error;
//     }
// };
