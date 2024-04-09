require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectID } = require('mongodb');
const uri = process.env.MONGOLINK;

const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

// Handle app termination
process.on('SIGINT', async () => {
    try {
      console.log('Closing MongoDB connection...');
      await client.close();
      console.log('MongoDB connection closed.');
    } finally {
      process.exit(0);
    }
});
    
module.exports = {
    client,
    ObjectID
};  