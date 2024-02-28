const nodemailer = require('nodemailer');
const { EmailClient } = require("@azure/communication-email");


let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        ciphers: 'SSLv3'
    },
    pool:true
})

function verifyEmail() {
    if (process.env.EMAIL_TYPE == 'AZURE')
        console.log("System configured for Azure Communication Services")
    else if (process.env.EMAIL_TYPE == 'SMTP')
        transporter.verify(function(error, success) {
            if (error) {
                console.log(error);
            } else {
                console.log("SMTP server is ready to take our messages");
            }
        });
}

async function sendEmail(addr, subject, content, attachment, fileName) {
    if (process.env.EMAIL_TYPE == 'AZURE')
        sendAzureEmail(addr,subject,content,attachment,fileName);
    else if (process.env.EMAIL_TYPE == 'SMTP')
        sendSMTPEmail(addr,subject,content,attachment,fileName);
}

async function sendSMTPEmail(addr, subject, content, attachment, fileName) {
    var mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
        to: addr,
        subject: subject,
        html: content,
        attachments: []
    };
    if (attachment) {
        await mailOptions.attachments.push(
            {
                filename: fileName,
                content: attachment,
                contentType: 'application/pdf'
            })
    }
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}

async function sendAzureEmail(addr,subject,content,attachment,fileName){
    const client = new EmailClient(process.env.AZURE_EMAIL_ENDPOINT);
    const message = {
        senderAddress: `${process.env.AZURE_EMAIL_ADDRESS}`,
        content: {
          subject: subject,
          html: content
        },
        recipients: {
          to: [
            {
              address: addr
            }
          ],
        },
        attachments: []
      };
      if (attachment){
        message.attachments.push(         
         {
            name: fileName,
            contentType: "application/pdf",
            content: attachment
        })
      }
    const poller = await client.beginSend(message);
    const response = await poller.pollUntilDone();
    console.log(`Message ID: ${response.id} - Status: ${response.status == 'Succeeded' ? 'Sent!' : response.error}`);
}

module.exports = { sendEmail, verifyEmail }