/**
 * 参考文档
 * https://help.aliyun.com/document_detail/60949.html?spm=a2c4g.11186623.6.560.276d32c0LMT3aL
 */

const express = require('express');
const bodyParser = require('body-parser');
const shell = require('shelljs');
const { sendMail } = require('./utils');
const {
  APP_PORT,
  MAIL_TO_DEV,
  MAIL_TO_PRO,
  DEPLOY_DOMAIN,
  DEPLOY_DEV_PORT,
  DEPLOY_PROD_PORT,
} = require('./config');

const app = express();
const jsonParser = bodyParser.json();

const validSecret =
  '5a7d212e-ac90-40a3-aeb6-828d071a786c' || process.env.ALIYUN_DOCKER_TRIGGER_SECRET;
const port = APP_PORT || process.env.ALIYUN_DOCKER_TRIGGER_PORT;

async function runCommand(cmd, ignoreError) {
  return new Promise((resolve, reject) => {
    const { code, stdout, stderr } = shell.exec(cmd);
    if (code === 0) {
      if (stderr && !ignoreError) {
        reject(new Error(`code:${code}, out:${stdout}, err:${stderr}`));
      } else {
        resolve(stdout);
      }
    } else if (!ignoreError) {
      reject(new Error(`code:${code}, out:${stdout}, err:${stderr}`));
    } else {
      resolve(stderr);
    }
  });
}

app.post('/trigger', jsonParser, async (req, res) => {
  const { secret } = req.query;
  if (secret !== validSecret) {
    res.statusCode = 404;
    res.end('no such location');
  } else {
    try {
      const { push_data = {}, repository = {} } = req.body;
      const { tag } = push_data;
      const { name, namespace, region } = repository;

      console.info(`镜像构建 - ${tag} 成功,开始部署`);

      const imageName = `registry.${region}.aliyuncs.com/${namespace}/${name}:${tag}`;
      const containerName = `${name}_${tag}`;
      await runCommand(
        `sudo docker stop ${containerName} || true && docker rm ${containerName} || true && docker rmi ${imageName} || true`,
        true
      );
      await runCommand(`sudo docker pull ${imageName}`);
      const appPort = tag == 'test' ? DEPLOY_DEV_PORT : DEPLOY_PROD_PORT;
      await runCommand(
        `sudo docker run --name ${containerName} -d -v /var/log/${containerName}:/outlogs -e APP_RUNTIME=${tag} -p ${appPort}:3000 ${imageName}`
      );

      const desc = tag === 'test' ? '测试' : '正式';
      let mailTo = MAIL_TO_DEV;

      if (tag !== 'test') {
        mailTo += `,${MAIL_TO_PRO}`;
      }

      await sendMail({
        subject: `【上线成功】税局站点 - ${desc}`,
        text: `已经上线成功了，快去看看吧。https://${
          tag === 'test' ? 'test' : 'www'
        }.${DEPLOY_DOMAIN}`,
        html: '',
        to: mailTo,
      });

      console.info(`镜像 - ${tag} 部署成功`);

      res.json({
        success: true,
        data: req.body,
      });
    } catch (err) {
      console.error(err);
      res.json({
        success: false,
        message: err.stack,
      });
    }
  }
});

app.listen(port, () => {
  console.log(`app listening at ${port}`);
});
