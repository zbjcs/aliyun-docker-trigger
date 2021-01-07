'use strict';

const nodemailer = require('nodemailer');
const { MAIL_HOST, MAIL_PORT, MAIL_ACCOUNT, MAIL_PWD, MAIL_FROM } = require('./config');

async function sendMail(data) {
  const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secureConnection: true,
    secure: true, // true for 465, false for other ports
    auth: {
      user: MAIL_ACCOUNT,
      pass: MAIL_PWD,
    },
  });

  const info = await transporter.sendMail({
    ...data,
    from: MAIL_FROM,
  });
  console.info('mail sent: %s', info.messageId);
}

module.exports = { sendMail };
