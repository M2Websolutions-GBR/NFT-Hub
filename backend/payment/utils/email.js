import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true für Port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendCertificateEmail = async ({ to, username, title, filePath }) => {
  const mailOptions = {
    from: `"NFT Hub" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your NFT Certificate for "${title}"`,
    text: `Hi ${username},\n\nThanks for your purchase!\nPlease find attached your official NFT ownership certificate for "${title}".\n\nBest regards,\nNFT Hub`,
    attachments: [
      {
        filename: `${title}_certificate.pdf`,
        content: fs.createReadStream(filePath),
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};
