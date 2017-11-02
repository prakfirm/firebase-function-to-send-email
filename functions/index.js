'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const nodemailer = require('nodemailer');
const GibberishAES = require('gibberish-aes/dist/gibberish-aes-1.0.0.js');
admin.initializeApp(functions.config().firebase);

exports.httpEmail = functions.https.onRequest((req, res) => {
	cors(req, res, () => {
		return Promise.resolve()
			.then(() => {
				if (req.method !== 'POST') {
					var errorResponse = {
						message: 'Only POST requests are accepted'
					}
					res.json(errorResponse);
					res.status(405).send();
				}
				
				if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
					var errorResponse = {
						message: 'No token was passed as a Bearer token in the Authorization header. Make sure you authorize your request by providing the following HTTP header: Authorization: Bearer <Token>'
					}
					res.json(errorResponse);
					res.status(403).send();
				}
				
				if (!req.headers.smtpserver || !req.headers.smtpport || !req.headers.smtpsecure || !req.headers.emailuser || !req.headers.encrypedpassword) {
					var errorResponse = {
						message: 'One or more header parameter is missing',
						smtpserver: req.headers.smtpserver,
						smtpport: req.headers.smtpport,
						smtpsecure: req.headers.smtpsecure,
						emailuser: req.headers.emailuser,
						encryptedpassword: req.headers.encryptedpassword
					}
					res.json(errorResponse);
					res.status(400).send();
					
				}
					
				const gibberishAesKey = functions.config().env.gibberishaeskey
				// Read the ID Token from the Authorization header.
				let emailPassword = req.headers.authorization.split('Bearer ')[1];
				
				if (req.headers.encrypedpassword === 'True') {
					emailPassword = GibberishAES.dec(gibberishAesKey, idToken);
				}
				
				const mailTransport = nodemailer.createTransport({
					host: req.headers.smtpserver,
					port: req.headers.smtpport,
					secure: req.headers.smtpsecure, // true for 465, false for other ports
					auth: {
						user: req.headers.emailuser, // Email user
						pass: emailPassword  // Email password
					}
				});
				const mailOptions = {
						from: req.body.from,
						to: req.body.to, //get from form input field of html file
						subject: req.body.subject,
						generateTextFromHTML: true,
						html: req.body.content
					};
				return mailTransport.sendMail(mailOptions)
							.then((info) => {
								var errorResponse = {
									message: 'Message sent successfully'
								}
								res.json(errorResponse);
								res.status(200).send();
							})
							.catch(error => {
								console.error('There was an error while sending the email:', error);  
							});
			})
			.then((response) => {
			  res.end();
			})
			.catch((err) => {
      console.error(err);
      return Promise.reject(err);
    });	
	})
  
})