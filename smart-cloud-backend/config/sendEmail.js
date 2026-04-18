const nodemailer = require("nodemailer");

const sendEmail = async (email, otp) => {

const transporter = nodemailer.createTransport({

service: "gmail",

auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS
}

});

const mailOptions = {

from: process.env.EMAIL_USER,

to: email,

subject: "Smart Cloud OTP Verification",

html: `
<h2>Your OTP Code</h2>
<h1>${otp}</h1>
<p>This OTP will expire in 5 minutes.</p>
`

};

await transporter.sendMail(mailOptions);

};

module.exports = sendEmail;