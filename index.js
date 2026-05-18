const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// ===================================================
// ✅ Middleware
// ===================================================
app.use(cors());
app.use(express.json());


// ===================================================
// ✅ MongoDB URI
// ===================================================
const uri =
  "mongodb+srv://household:pNkXSw2GTIAiUZkj@cluster0.4h16s8h.mongodb.net/?appName=Cluster0";


// ===================================================
// ✅ Mongo Client
// ===================================================
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// ===================================================
// ✅ Root Route
// ===================================================
app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});


// ===================================================
// ✅ Main Function
// ===================================================
async function run() {

  try {

    // Connect MongoDB
    await client.connect();

    // Database
    const householdDB = client.db('household');

    // Collections
    const userCollection = householdDB.collection('services');

    const bookingCollection = householdDB.collection('bookings');



    // ===================================================
    // ✅ GET all services
    // ===================================================
    app.get('/household', async (req, res) => {

      const result = await userCollection.find().toArray();

      res.send(result);
    });




    // ===================================================
    // ✅ GET logged-in provider services
    // ===================================================
    app.get('/household/provider/:email', async (req, res) => {

      const email = req.params.email;

      const query = {
        providerEmail: email
      };

      const result = await userCollection.find(query).toArray();

      res.send(result);
    });




    // ===================================================
    // ✅ GET single service by ID
    // ===================================================
    app.get('/household/:id', async (req, res) => {

      const id = req.params.id;

      try {

        const result = await userCollection.findOne({
          _id: new ObjectId(id)
        });

        if (!result) {

          return res.status(404).send({
            message: "Service not found"
          });
        }

        res.send(result);

      } catch (error) {

        console.error("Error fetching service:", error);

        res.status(500).send({
          message: "Invalid ID"
        });
      }
    });




    // ===================================================
    // ✅ POST new service
    // ===================================================
    app.post('/household', async (req, res) => {

      const newService = req.body;

      const result = await userCollection.insertOne(newService);

      res.send(result);
    });




    // ===================================================
    // ✅ UPDATE service
    // ===================================================
    app.put('/household/:id', async (req, res) => {

      const id = req.params.id;

      const updatedService = req.body;

      const filter = {
        _id: new ObjectId(id)
      };

      const updatedDoc = {
        $set: {
          serviceName: updatedService.serviceName,
          image: updatedService.image,
          category: updatedService.category,
          price: updatedService.price,
          description: updatedService.description
        }
      };

      const result = await userCollection.updateOne(
        filter,
        updatedDoc
      );

      res.send(result);
    });




    // ===================================================
    // ✅ DELETE service
    // ===================================================
    app.delete('/household/:id', async (req, res) => {

      const id = req.params.id;

      const query = {
        _id: new ObjectId(id)
      };

      const result = await userCollection.deleteOne(query);

      res.send(result);
    });




    // ===================================================
    // ✅ POST booking
    // ===================================================
    app.post('/bookings', async (req, res) => {

      const booking = req.body;

      try {

        const result = await bookingCollection.insertOne(booking);

        res.send(result);

      } catch (error) {

        console.error("Booking Error:", error);

        res.status(500).send({
          message: 'Failed to save booking'
        });
      }
    });




    // ===================================================
    // ✅ GET all bookings
    // ===================================================
    app.get('/bookings', async (req, res) => {

      const result = await bookingCollection.find().toArray();

      res.send(result);
    });

    // ===================================================
// ✅ DELETE booking
// ===================================================
app.delete('/bookings/:id', async (req, res) => {

  const id = req.params.id;

  const query = {
    _id: new ObjectId(id)
  };

  const result = await bookingCollection.deleteOne(query);

  res.send(result);
});



    // ===================================================
    // ✅ GET bookings by user email
    // ===================================================
    app.get('/bookings/:email', async (req, res) => {

      const email = req.params.email;

      const query = {
        userEmail: email
      };

      const result = await bookingCollection.find(query).toArray();

      res.send(result);
    });




    // ===================================================
    // ✅ MongoDB Ping
    // ===================================================
    await client.db("admin").command({ ping: 1 });

    console.log("✅ Connected to MongoDB");

  }

  catch (error) {

    console.error(error);
  }
}

run();


// ===================================================
// ✅ Start Server
// ===================================================
app.listen(port, () => {

  console.log(`🚀 Server running on port ${port}`);
});