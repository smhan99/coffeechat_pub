"use strict";

//Import dependencies
const config = require("./config"),
  User = require("./user"),
  { MongoClient, ServerApiVersion } = require('mongodb');
  
// const fixieData = config.fixieData

const client = new MongoClient(config.mongoUri, 
  { 
    useNewUrlParser: true, 
    useUnifiedTopology: true, 
    serverApi: ServerApiVersion.v1,

    // proxyUsername: fixieData[0],
    // proxyPassword: fixieData[1],
    // proxyHost: fixieData[2],
    // proxyPort: fixieData[3],
  });


module.exports = class MongoApi {
  static async insertUser(user) {
    try {
      const db = client.db(config.mongoDB)
      const userCol = db.collection("Users")
      const newUser = {
        psid: user.psid,
        firstName: user.firstName,
        lastName: user.lastName,
        locale: user.locale,
        timezone: user.timezone,
        gender: user.gender,
      }

      const result = await userCol.insertOne(newUser)

      console.log(`New user successfully inserted with the _id: ${result.insertedId}`)
    } catch (error) {
      throw error
    }
  }

  static async findUser(senderpsid) {
    try {
      const db = client.db(config.mongoDB)
      var result = await db.collection("Users").findOne({ psid: senderpsid })
      if (!result) throw new Error("User with specified psid does not exist in DB")
      var sender = {
        psid: senderpsid,
        firstName: result.firstName,
        lastName: result.lastName,
        locale: result.locale,
        timezone: result.timezone,
        gender: result.gender,
      }
      console.log(`Sender Queried Successfully`)
      return sender
    } catch (error) {
      throw error
    }
  }

  static async populateUsers(users) {
    try {
      const db = client.db(config.mongoDB)
      const result = db.collection("Users").find({})
      if (!result) {
        console.error("No Users in DB")
        return
      }

      while (await result.hasNext()) {
        var document = await result.next()
        var psid = document.psid
        let user = new User(psid)
        user.setProfile(document)
        users[psid] = user
      }
    } catch (error) {
      throw error
    }
  }
}