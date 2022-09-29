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

require("dotenv").config();

// Required environment variables
const ENV_VARS = [
  "PAGE_ID",
  "APP_ID",
  "PAGE_ACCESS_TOKEN",
  "APP_SECRET",
  "VERIFY_TOKEN",
  "APP_URL"
];

module.exports = {
  // Messenger Platform API
  apiDomain: "https://graph.facebook.com",
  apiVersion: "v11.0",
  
  // Page and Application information
  pageId: process.env.PAGE_ID,
  appId: process.env.APP_ID,
  pageAccesToken: process.env.PAGE_ACCESS_TOKEN,
  appSecret: process.env.APP_SECRET,
  verifyToken: process.env.VERIFY_TOKEN,
  
  // Preferred port (default to 3000)
  port: process.env.PORT || 3000,

  // URL of your app domain
  appUrl: process.env.APP_URL,

  mongoUser: process.env.MONGO_USERNAME,
  mongoPW: process.env.MONGO_PW,
  mongoCluster: process.env.MONGO_CLUSTER,
  mongoDB: process.env.MONGO_DBNAME,

  // MONGO_URI: process.env.MONGO_URI,

  // fixieData : process.env.FIXIE_SOCKS_HOST.split(new RegExp('[/(:\\/@/]+')),

  // Base URL for Messenger Platform API calls
  get apiUrl() {
    return `${this.apiDomain}/${this.apiVersion}`;
  },

  // URL of your webhook endpoint
  get webhookUrl() {
    return `${this.appUrl}/webhook`;
  },

  get mongoUri() {
    return `mongodb+srv://${this.mongoUser}:${this.mongoPW}@${this.mongoCluster}.08gg1ak.mongodb.net/?retryWrites=true&w=majority`;
  },

  checkEnvVariables: () => {
    console.log("checkEnvVariables")
    ENV_VARS.forEach((key) => {
      if (!process.env[key]) {
        console.warn("WARNING: Missing the environment variable " + key);
      } else {
        // Check that urls use https
        if (["APP_URL"].includes(key)) {
          const url = process.env[key];
          if (!url.startsWith("https://")) {
            console.warn(
              "WARNING: Your " + key + ' does not begin with "https://"'
            );
          }
        }
      }
    });
  }
}