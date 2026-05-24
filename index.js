const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://household:pNkXSw2GTIAiUZkj@cluster0.4h16s8h.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

async function run() {
  try {
    await client.connect();

    console.log("Connected to MongoDB");

    const householdDB = client.db('household');
    const userCollection = householdDB.collection('services');
    const bookingCollection = householdDB.collection('bookings');

    // ✅ GET ALL SERVICES (with optional price filter)
    app.get('/household', async (req, res) => {
      const min = parseInt(req.query.min) || 0;
      const max = parseInt(req.query.max) || Infinity;

      const query = {
        price: {
          $gte: min,
          $lte: max,
        },
      };

      try {
        const result = await userCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch services' });
      }
    });

    // ❌ FIXED: TOP SERVICES (NO LIMIT NOW)
    app.get('/top-services', async (req, res) => {
      try {
        const services = await userCollection.find().toArray();

        const sortedServices = services.sort((a, b) => {
          const aReviews = a.reviews || [];
          const bReviews = b.reviews || [];

          const aAvg =
            aReviews.length > 0
              ? aReviews.reduce((sum, r) => sum + r.rating, 0) /
                aReviews.length
              : 0;

          const bAvg =
            bReviews.length > 0
              ? bReviews.reduce((sum, r) => sum + r.rating, 0) /
                bReviews.length
              : 0;

          return bAvg - aAvg;
        });

        // ✅ RETURN ALL SERVICES
        res.send(sortedServices);

      } catch (error) {
        console.error(error);
        res.status(500).send({
          message: 'Failed to fetch top services',
        });
      }
    });

    // GET SERVICES BY PROVIDER EMAIL
    app.get('/household/provider/:email', async (req, res) => {
      const email = req.params.email;

      try {
        const result = await userCollection.find({
          providerEmail: email,
        }).toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({
          message: 'Failed to fetch provider services',
        });
      }
    });

    // GET SINGLE SERVICE
    app.get('/household/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await userCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!result) {
          return res.status(404).send({ message: "Service not found" });
        }

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Invalid ID" });
      }
    });

    // ADD SERVICE
    app.post('/household', async (req, res) => {
      const newService = req.body;

      try {
        const result = await userCollection.insertOne(newService);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to add service' });
      }
    });

    // UPDATE SERVICE
    app.put('/household/:id', async (req, res) => {
      const id = req.params.id;
      const updatedService = req.body;

      const filter = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          serviceName: updatedService.serviceName,
          image: updatedService.image,
          category: updatedService.category,
          price: updatedService.price,
          description: updatedService.description,
        },
      };

      try {
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to update service' });
      }
    });

    // DELETE SERVICE
    app.delete('/household/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await userCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to delete service' });
      }
    });

    // ADD BOOKING
    app.post('/bookings', async (req, res) => {
      const booking = req.body;

      try {
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to save booking' });
      }
    });

    // GET ALL BOOKINGS
    app.get('/bookings', async (req, res) => {
      try {
        const result = await bookingCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch bookings' });
      }
    });

    // GET BOOKINGS BY EMAIL
    app.get('/bookings/:email', async (req, res) => {
      const email = req.params.email;

      try {
        const result = await bookingCollection.find({
          userEmail: email,
        }).toArray();

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch bookings' });
      }
    });

    // DELETE BOOKING
    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const result = await bookingCollection.deleteOne({
          _id: new ObjectId(id),
        });

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to cancel booking' });
      }
    });

    // ADD REVIEW
    app.patch('/services/review/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const review = req.body;

        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          { $push: { reviews: review } }
        );

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to add review' });
      }
    });

    console.log("MongoDB Ping Success");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});