import nodemailer from 'nodemailer';
import fs from 'fs';

export const sendCertificateEmail = async ({ buyerEmail, buyerName, filePath, fileName }) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',  // z. B. smtp.gmail.com
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, // z. B. noreply@nfthub.com
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"NFT Hub" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `Dein NFT-Zertifikat – ${fileName.replace('.pdf', '')}`,
    text: `Hi ${buyerName},\n\ndanke für deinen Kauf! Anbei findest du dein NFT-Zertifikat.\n\n– Dein NFT Hub`,
    attachments: [
      {
        filename: fileName,
        path: filePath,
        contentType: 'application/pdf'
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};
