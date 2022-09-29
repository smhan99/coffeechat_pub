/**
 * Copyright 2021-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Messenger For Original Coast Clothing
 * https://developers.facebook.com/docs/messenger-platform/getting-started/sample-apps/original-coast-clothing
 */

"use strict";

// Imports dependencies and set up http server
const
  express = require('express'),
  { urlencoded, json } = require("body-parser"),
  crypto = require("crypto"),
  GraphApi = require("./services/graph-api"),
  MongoApi = require("./services/mongo-api"),
  User = require("./services/user"),
  Receive = require("./services/receive"),
  Response = require("./services/response"),
  config = require('./services/config'),
  app = express(); // creates express http server

var users = {};

// Parse application/x-www-form-urlencoded
app.use(
  urlencoded({
    extended: true
  })
);

// Parse application/json. Verify that callback came from Facebook
app.use(json({ verify: verifyRequestSignature }));


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === config.verifyToken) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
  let body = req.body;

  console.log(`\u{1F7EA} Received webhook:`);
  console.dir(body, { depth: null });

  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(async (entry) => {

      entry.messaging.forEach(async (webhookEvent) => {
        // Discard uninteresting events
        if ("read" in webhookEvent) {
          console.log("Got a read event");
          return;
        } else if ("delivery" in webhookEvent) {
          console.log("Got a delivery event");
          return;
        } else if (webhookEvent.message && webhookEvent.message.is_echo) {
          console.log(
            "Got an echo of our send, mid = " + webhookEvent.message.mid
          );
          return;
        }

        // Get the sender PSID
        let senderPsid = webhookEvent.sender.id;

        //dont need all this chat plugin stuff
        // // Get the user_ref if from Chat plugin logged in user
        // let user_ref = webhookEvent.sender.user_ref;
        // // Check if user is guest from Chat plugin guest user
        // let guestUser = isGuestUser(webhookEvent);

        //also not going to set i18next module yet

        if (senderPsid != null && senderPsid != undefined) {
          if (!(senderPsid in users)) {
            // Don't need below because we populate users on start
            // MongoApi.findUser(senderPsid)
            // .then(userProfile => {
            //   console.log(userProfile)
            //   console.log("Profile retrieved from MongoDB with PSID:", userProfile.psid)
            //   users[senderPsid] = userProfile
            //   return receiveAndReturn(users[senderPsid], webhookEvent);
            // })
            // .catch(error => {
            //   console.log("Unable to get user from DB because of error: ", error)
            let user = new User(senderPsid)
            GraphApi.getUserProfile(senderPsid)
            .then(userProfile => {
              user.setProfile(userProfile)
            })
            .catch(error => {
              // The profile is unavailable
              console.log(JSON.stringify(body));
              console.log("Profile is unavailable:", error);
            })
            .finally(async () => {
              console.log("locale: " + user.locale);
              users[senderPsid] = user;
              await MongoApi.insertUser(user)
              .catch(error => {
                console.log("Error while inserting User to Mongodb: ", error)
              })
              .catch(console.dir)

              // also tried making domesticated DB but it doesn't make sense so commenting it out
              // let stream = fs.createWriteStream("user.json", {flags:'a'})
              // stream.write(`\n${JSON.stringify(users[senderPsid])}`)
              // stream.end()
              // i18n.setLocale("en_US");
              console.log("New Profile PSID:", senderPsid)
              // ,
              // "with locale:",
              // i18n.getLocale()
              return receiveAndReturn(users[senderPsid], webhookEvent);
            });
            // })
            // .catch(console.dir)
            // Make call to UserProfile API only if user is not guest
            
            //dont need this guest user stuff
            //  else {
            //   setDefaultUser(senderPsid);
            //   return receiveAndReturn(users[senderPsid], webhookEvent, false);
            // }
          } else {
            // i18n.setLocale(users[senderPsid].locale);
            console.log("Profile already exists PSID:", senderPsid)
            // ,
            // "with locale:",
            // i18n.getLocale());
            return receiveAndReturn(users[senderPsid], webhookEvent);
          }
        }
        //dont need this chat plugin stuff
        //  else if (user_ref != null && user_ref != undefined) {
        //   // Handle user_ref
        //   setDefaultUser(user_ref);
        //   return receiveAndReturn(users[user_ref], webhookEvent, true);
        // }
      })   
    });
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

app.get('/manual', (req, res) => {
  res.sendFile(__dirname + '/views/manual.html');
})

function receiveAndReturn(user, webhookEvent) {
  //Sender Action is to create an illusion that app is typing
  GraphApi.senderActionAPI(user);
  //Send the actual message back after 2 seconds
  let receiveMessage = new Receive(user, webhookEvent);
  return setTimeout(() => receiveMessage.handleMessage(), 2000);
}

// Verify that the callback came from Facebook.
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    console.warn(`Couldn't find "x-hub-signature" in headers.`);
  } else {
    var elements = signature.split("=");
    var signatureHash = elements[1];
    var expectedHash = crypto
      .createHmac("sha1", config.appSecret)
      .update(buf)
      .digest("hex");
    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

// Check if all environment variables are set
config.checkEnvVariables();

// Sets server port and logs message on success
app.listen(config.port, async function() {
  await MongoApi.populateUsers(users)
  .catch(console.error)
  .catch(error => {
    console.log("Error while populating Users: ", error)
  })
  await Response.populate()
  .catch(console.error)
  Response.read()
  console.log('webhook is listening')
});