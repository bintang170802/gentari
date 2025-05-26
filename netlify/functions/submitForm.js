const { XataClient } = require('./xata'); // Import Xata client dari file xata.js
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { google } = require('googleapis');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const xata = new XataClient();

    // 1. Simpan ke Xata
    await xata.db.pendaftar.create({
      name: data.name,
      email: data.email,
      message: data.message,
    });

    // 2. Generate dokumen Word
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun(`Name: ${data.name}`),
                new TextRun('\n'),
                new TextRun(`Email: ${data.email}`),
                new TextRun('\n'),
                new TextRun(`Message: ${data.message}`),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // 3. Upload ke Google Drive
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const fileMetadata = {
      name: `Form_${data.name}_${Date.now()}.docx`,
      parents: [process.env.GOOGLE_FOLDER_ID],
    };
    const media = {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: Buffer.from(buffer),
    };

    await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
