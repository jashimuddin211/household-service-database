const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = "mongodb+srv://household:pNkXSw2GTIAiUZkj@cluster0.4h16s8h.mongodb.net/?appName=Cluster0";

// Mongo Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

async function run() {
  try {
    await client.connect();

    const householdDB = client.db('household');
    const userCollection = householdDB.collection('services');

    // ✅ GET all services
    app.get('/household', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // ✅ GET single service by ID (🔥 MOST IMPORTANT FIX)
    app.get('/household/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await userCollection.findOne({
          _id: new ObjectId(id)
        });

        if (!result) {
          return res.status(404).send({ message: "Service not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).send({ message: "Invalid ID" });
      }
    });

    // ✅ POST: Add new service
    app.post('/household', async (req, res) => {
      const newService = req.body;
      const result = await userCollection.insertOne(newService);
      res.send(result);
    });

    // optional: ping test
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB");

  } catch (error) {
    console.error(error);
  }
}

run();

// start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});