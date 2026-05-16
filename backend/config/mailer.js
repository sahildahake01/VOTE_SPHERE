const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

// Only create transporter if email credentials are provided
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    transporter.verify((error, success) => {
        if (error) {
            console.log('⚠️ Email service not configured:', error.message);
        } else {
            console.log('✅ Email service ready');
        }
    });
} else {
    console.log('⚠️ Email disabled - no credentials provided');
}

const sendEmail = async (to, subject, html) => {
    if (!transporter) {
        console.log('Email skipped: no transporter configured');
        return false;
    }
    try {
        await transporter.sendMail({
            from: `"Voting Platform" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        return true;
    } catch (error) {
        console.error('Email error:', error.message);
        return false;
    }
};

module.exports = { sendEmail };