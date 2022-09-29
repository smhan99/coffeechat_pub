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

const fs = require('fs/promises'),
  config = require('./config');

var responses = {}

module.exports = class Response {
  static async populate()  {
    try {
      const data = await fs.readFile(__dirname + '/responses.json', { encoding: 'utf8' });
      responses = JSON.parse(data)
    } catch (err) {
      console.log(err);
    }
  }

  //Debug function
  static async read() {
    console.log(responses.start_menu.profile_setting)
  }

  static genQuickReply(text, quickReplies) {
    let response = {
      text: text,
      quick_replies: []
    };

    for (let quickReply of quickReplies) {
      response["quick_replies"].push({
        content_type: "text",
        title: quickReply["title"],
        payload: quickReply["payload"]
      });
    }

    return response;
  }

  // static genGenericTemplate(image_url, title, subtitle, buttons) {
  //   let response = {
  //     attachment: {
  //       type: "template",
  //       payload: {
  //         template_type: "generic",
  //         elements: [
  //           {
  //             title: title,
  //             subtitle: subtitle,
  //             image_url: image_url,
  //             buttons: buttons
  //           }
  //         ]
  //       }
  //     }
  //   };
  //   return response;
  // }

  // static genRecurringNotificationsTemplate(
  //   image_url,
  //   title,
  //   notification_messages_frequency,
  //   payload
  // ) {
  //   let response = {
  //     attachment: {
  //       type: "template",
  //       payload: {
  //         template_type: "notification_messages",
  //         title: title,
  //         image_url: image_url,
  //         notification_messages_frequency: notification_messages_frequency,
  //         payload: payload
  //       }
  //     }
  //   };
  //   return response;
  // }

  static genImageTemplate(image_url, title, subtitle = "") {
    let response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: title,
              subtitle: subtitle,
              image_url: image_url
            }
          ]
        }
      }
    };

    return response;
  }

  static genButtonTemplate(title, buttons) {
    let response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: title,
          buttons: buttons
        }
      }
    };

    return response;
  }

  static genText(text) {
    let response = {
      text: text
    };

    return response;
  }

  static genPostbackButton(title, payload) {
    let response = {
      type: "postback",
      title: title,
      payload: payload
    };

    return response;
  }

  static genWebUrlButton(title, url) {
    let response = {
      type: "web_url",
      title: title,
      url: url,
    };

    return response;
  }

  static genFallbackMessage(user, message) {
    let sorry = this.genText(responses.fallback.any.replace("{{userFirstName}}", user.firstName).replace("{{message}}", message));
    let guide = this.genQuickReply( responses.fallback.but, [
      {
        title: "Get Started",
        payload: "GET STARTED"
      },
    ]);
    return [sorry, guide]
  }
  
  static genFallbackAttachment(url) {
    let sorry = this.genImageTemplate(url, responses.fallback.attachment_title, responses.fallback.attachment_subtitle);
    let guide = this.genQuickReply( responses.fallback.but, [
      {
        title: "Get Started",
        payload: "GET STARTED"
      },
    ]);
    return [sorry, guide]
  }

  static genManualMessage() {
    let manual = this.genWebUrlButton("Link to Manual", `${config.appUrl}/manual`);
    let visit = this.genButtonTemplate(responses.manual.access_manual, [manual]);
    let back_button = this.genPostbackButton("Start Over", "start_over")
    let back = this.genButtonTemplate(responses.manual.come_back, [back_button]);
    return [visit, back]
  }

  static genGroupMenu() {
    return this.genQuickReply(responses.group_menu.welcome, [
      {
        title: responses.group_menu.create_group,
        payload: "GROUP_CREATE"
      },
      {
        title: responses.group_menu.register_group,
        payload: "GROUP_REGISTER"
      },
      {
        title: responses.group_menu.manage_group,
        payload: "GROUP_MANAGE"
      }
    ]);
  }

  static genNuxMessage(user) {
    let welcome = this.genText( responses.get_started.welcome.replace("{{userFirstName}}", user.firstName) );

    let guide = this.genQuickReply( responses.get_started.guidance, [
      {
        title: responses.start_menu.profile_setting,
        payload: "START_PROFILE"
      },
      {
        title: responses.start_menu.group_setting,
        payload: "START_GROUP"
      },
      {
        title: responses.start_menu.how_to,
        payload: "START_HOW_TO"
      }
    ]);

    return [welcome, guide];
  }
};