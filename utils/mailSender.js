const nodemailer = require("nodemailer");

const { CONFIG } = require('../constants/config')

const mailSender = async (email, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            host: CONFIG.KEYS.NODEMAILER.MAIL_HOST,
            auth: {
                user: CONFIG.KEYS.NODEMAILER.MAIL_USER,
                pass: CONFIG.KEYS.NODEMAILER.HOST_PASS,
            },
            secure: false,
        })

        let info = await transporter.sendMail({
            from: `"Walmart" <${CONFIG.KEYS.NODEMAILER.MAIL_USER}>`, // sender address
            to: `${email}`, // list of receivers
            subject: `${title}`, // Subject line
            html: `${body}`, // html body
        });
        console.log(info.response)
        return info;
    } catch (error) {
        console.log(error.message)
        return error.message
    }
}

module.exports = mailSender;