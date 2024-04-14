const {User, Message} = require('./models')
require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_DEV_URL || process.env.MONGO_PROD_URL || '')
  .then(success => console.log('success'))

async function populateDb() {
  console.log('creating....')
  await Message.create({author: '661adf42df83933efad0a339', title: "A Title", text: "This is an announcement"})
  console.log('done!')
}
populateDb()
