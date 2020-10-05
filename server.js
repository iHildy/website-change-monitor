const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const { Webhook, MessageBuilder } = require("webhook-discord");

//Express configuration
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
const PORT = process.env.PORT || 3000;


//Main configuration variables
const urlToCheck = `https://www.theblackdog.com/collections/mens-sweatshirts/products/mens-classic-heavyweight-hood?variant=31487000641630`;
const elementsToSearchFor = ['ADD TO CART', 'imageYouWantToCheckItsExistence.png'];
const checkingFrequency = 10 * 60000; //first number represent the checkingFrequency in minutes

//Slack Integration
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';
const slack = require('slack-notify')(SLACK_WEBHOOK_URL);

//Discord Integration
const Hook = new Webhook("https://discord.com/api/webhooks/762091942233243679/GxugIBZbKxZLHtUeFrKckB4k1ha_PbJqPiu8LFm8VQUTTaVZKwyD2HanCc7WmlMfnQsT")

//SendGrid Email Integration
const SENDGRID_APY_KEY = 'AA.AAAA_AAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_APY_KEY);
const emailFrom = 'aaa@aaa.com';
const emailsToAlert = ['emailOneToSend@theAlert.com', 'emailTwoToSend@theAlert.com'];


const checkingNumberBeforeWorkingOKEmail = 1440 / (checkingFrequency / 60000);   //1 day = 1440 minutes
let requestCounter = 0;


//Main function
const intervalId = setInterval(function () {

    request(urlToCheck, function (err, response, body) {
        //if the request fail
        if (err) {
            console.log(`Request Error - ${err}`);
        }
        else {
            //if the target-page content is empty
            if (!body) {
                console.log(`Request Body Error - ${err}`);
            }
            //if the request is successful
            else {

                //if any elementsToSearchFor exist
                if (elementsToSearchFor.some((el) => body.includes(el))) {

                    // Slack Alert Notification
                    slack.alert(`🔥🔥🔥  <${urlToCheck}/|Change detected in ${urlToCheck}>  🔥🔥🔥 `, function (err) {
                        if (err) {
                            console.log('Slack API error:', err);
                        } else {
                            console.log('Message received in slack!');
                        }
                    });

                    // Discord Alert Notification
                    const discordmsg = new MessageBuilder()
                        .setName("Web Monitor")
                        .setColor("#00ff1e")
                        .setTitle('Web Monitor Executed Successfuly')
                        .setDescription("Keywords found!", true)
                        .addField('Checkout!', `${urlToCheck}`, true)
                        .setFooter('Web Monitor | Forked by iHildy#3839', 'https://avatars2.githubusercontent.com/u/25069719?s=460&u=0758922d6a85a09f971fbf778bb720788a2f2e5b&v=4')
                        .setTime();
                    Hook.send(discordmsg);

                    // Email Alert Notification
                    const msg = {
                        to: emailsToAlert,
                        from: emailFrom,
                        subject: `🔥🔥🔥 Change detected in ${urlToCheck} 🔥🔥🔥`,
                        html: `Change detected in <a href="${urlToCheck}"> ${urlToCheck} </a>  `,
                    };
                    sgMail.send(msg)
                        .then(()=>{console.log("Alert Email Sent!");})
                        .catch((emailError)=>{console.log(emailError);});
                }

            }
        }
    });

    requestCounter++;


    // "Working OK" email notification logic
    if (requestCounter > checkingNumberBeforeWorkingOKEmail) {

        requestCounter = 0;

        const msg = {
            to: emailsToAlert,
            from: emailFrom,
            subject: '👀👀👀 Website Change Monitor is working OK 👀👀👀',
            html: `Website Change Monitor is working OK - <b>${new Date().toLocaleString("en-US", {timeZone: "America/New_York"})}</b>`,
        };
        sgMail.send(msg)
            .then(()=>{console.log("Working OK Email Sent!");})
            .catch((emailError)=>{console.log(emailError);});
    }

}, checkingFrequency);


//Index page render
app.get('/', function (req, res) {
    res.render('index', null);
});


//Server start
app.listen(PORT, function () {
    console.log(`Example app listening on port ${PORT}!`)
});
