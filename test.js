'use strict';

const { sendMail } = require('./utils');

(async () => {
  await sendMail({
    text: '已经上线成功了，快去看看吧', // plain text body
    html: '', // html body
  });

  console.info('ok');
})();
