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

const 
  // Curation = require("./curation"),
  // Order = require("./order"),
  // Response = require("./response"),
  // Care = require("./care"),
  // Survey = require("./survey"),
  config = require('./config'),
  GraphApi = require("./graph-api"),
  Response = require("./response");
  // i18n = require("../i18n.config");

module.exports = class Receive {
  constructor(user, webhookEvent) {
    this.user = user;
    this.webhookEvent = webhookEvent;
  }

  // Check if the event is a message or postback and
  // call the appropriate handler function
  handleMessage() {
    let event = this.webhookEvent;

    let responses;

    try {
      if (event.message) {
        let message = event.message;

        if (message.quick_reply) {
          responses = this.handleQuickReply();
        } else 
        if (message.attachments) {
          responses = this.handleAttachmentMessage();
        } else if (message.text) {
          responses = this.handleTextMessage();
        }
      } else if (event.postback) {
        responses = this.handlePostback();
      }
      // TODO: HANDLE THESE TYPES LATER
      // } else if (event.referral) {
      //   responses = this.handleReferral();
      // } else if (event.optin) {
      //   responses = this.handleOptIn();
      // }
    } catch (error) {
      console.error(error);
      responses = {
        text: `An error has occured: '${error}'. We have been notified and \
        will fix the issue shortly!`
      };
    }

    if (Array.isArray(responses)) {
      let delay = 0;
      for (let response of responses) {
        this.sendMessage(response, delay * 2000);
        delay++;
      }
    } else {
      this.sendMessage(responses);
    }
  }

  // Handles messages events with text
  handleTextMessage() {
    console.log(
      "Received text:",
      `${this.webhookEvent.message.text} for ${this.user.psid}`
    );

    let event = this.webhookEvent;
    let message = event.message.text.trim().toLowerCase();

    let response;

    if (message.includes("special")) {
      response = {
        "text": `\u{1F7EA} This is a special message only shown to special users :) \u{1F7EA}
                  Now try sending a message with hi or hello.`
      }
    } else if (message.includes("start")    ||
               message.includes("hi")       ||
               message.includes("hello")    ||
               message.includes("started")
              ) {
      response = Response.genNuxMessage(this.user);
    } else {
      response = Response.genFallbackMessage(this.user, event.message.text);
    }
    return response;
  }

  // Handles mesage events with attachments
  handleAttachmentMessage() {
    let response;

    // Get the attachment
    let attachment = this.webhookEvent.message.attachments[0];
    console.log("Received attachment:", `${attachment} for ${this.user.psid}`);

    let attachment_url = attachment.payload.url;
    response = Response.genFallbackAttachment(attachment_url);

    return response;
  }

  // Handles mesage events with quick replies
  handleQuickReply() {
    // Get the payload of the quick reply
    let payload = this.webhookEvent.message.quick_reply.payload;

    return this.handlePayload(payload);
  }

  // Handles postbacks events
  handlePostback() {
    let postback = this.webhookEvent.postback;
    let payload = postback.payload;

    return this.handlePayload(payload.toUpperCase());
  }

  // TODO: HANDLE REFERRAL EVENT LATER
  // Handles referral events
  // handleReferral() {
  //   // Get the payload of the postback
  //   let payload = this.webhookEvent.referral.ref.toUpperCase();

  //   return this.handlePayload(payload);
  // }

  // TODO: HANDLE OPTIN EVENT LATER
  // Handles optins events
  // handleOptIn() {
  //   let optin = this.webhookEvent.optin;
  //   // Check for the special Get Starded with referral
  //   let payload;
  //   if (optin.type === "notification_messages") {
  //     payload = "RN_" + optin.notification_messages_frequency.toUpperCase();
  //     this.sendRecurringMessage(optin.notification_messages_token, 5000);
  //     return this.handlePayload(payload);
  //   }
  //   return null;
  // }

  // TODO: HANDLE PAYLOAD GENERAL CASE LATER
  handlePayload(payload) {
    console.log("Received Payload:", `${payload} for ${this.user.psid}`);
    let response;
    
    // Set the response based on the payload
    switch(payload) {
      case "GET STARTED":
        response = Response.genNuxMessage(this.user);
        break;
      case "START_OVER":
        response = Response.genNuxMessage(this.user);
        break;
      case "START_HOW_TO":
        response = Response.genManualMessage();
        break;
      case "START_PROFILE":
        response = {
          text: `START_PROFILE not yet implemented!`
        };
        break;
      case "START_GROUP":
        response = Response.genGroupMenu();
        break;
      case "GROUP_CREATE":
        //lead to a webpage where user can submit a form that creates 
        response = {
          text: `GROUP_CREATE not yet implemented!`
        };
        break;
      case "GROUP_REGISTER":
        response = {
          text: `GROUP_REGISTER not yet implemented!`
        };
        break;
      case "GROUP_MANAGE":
        response = {
          text: `GROUP_MANAGE not yet implemented!`
        };
        break;
      default:
        response = {
          text: `This is a default postback message for payload: ${payload}!`
        };
        break;
    }
    //TODO: Will have to look into this recurring noti later
    // } else if (payload === "RN_WEEKLY") {
    //   response = {
    //     text: `[INFO]The following message is a sample weekly recurring notification. This is usually sent outside the initial 24-hour window for users who have opted in to weekly messages.`
    //   };

    return response;
  }

  sendMessage(response, delay = 0) {
    // Check if there is delay in the response
    if (response === undefined) {
      return;
    }
    if ("delay" in response) {
      delay = response["delay"];
      delete response["delay"];
    }
    // Construct the message body
    let requestBody = {
      recipient: {
        id: this.user.psid
      },
      message: response
    };

    setTimeout(() => GraphApi.callSendApi(requestBody), delay);
  }

  // TODO: FOR OPT IN? DONT NEED FOR NOW
  // sendRecurringMessage(notificationMessageToken, delay) {
  //   console.log("Received Recurring Message token");
  //   let requestBody = {},
  //     response,
  //     curation;
  //   //This example will send summer collection
  //   curation = new Curation(this.user, this.webhookEvent);
  //   response = curation.handlePayload("CURATION_BUDGET_50_DINNER");
  //   // Check if there is delay in the response
  //   if (response === undefined) {
  //     return;
  //   }
  //   requestBody = {
  //     recipient: {
  //       notification_messages_token: notificationMessageToken
  //     },
  //     message: response
  //   };

  //   setTimeout(() => GraphApi.callSendApi(requestBody), delay);
  // }
  // firstEntity(nlp, name) {
  //   return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
  // }
};
