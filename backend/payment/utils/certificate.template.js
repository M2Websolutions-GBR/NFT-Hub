export const generateCertificateHTML = ({ username, title, date }) => `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          text-align: center;
        }
        .box {
          border: 4px solid #000;
          padding: 40px;
        }
        h1 {
          margin-bottom: 20px;
        }
        p {
          font-size: 18px;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>Certificate of Ownership</h1>
        <p>This certifies that <strong>${username}</strong></p>
        <p>owns the NFT titled:</p>
        <h2>${title}</h2>
        <p>Purchased on ${date}</p>
      </div>
    </body>
  </html>
`;
