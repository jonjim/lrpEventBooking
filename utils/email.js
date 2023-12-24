const nodemailer = require('nodemailer');

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
    }
})

function verifyEmail() {
    transporter.verify(function(error, success) {
        if (error) {
            console.log(error);
        } else {
            console.log("SMTP server is ready to take our messages");
        }
    });
}

function sendEmail(addr, subject, content) {
    var mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
        to: addr,
        subject: subject,
        html: content
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });

}

module.exports = { sendEmail, verifyEmail }