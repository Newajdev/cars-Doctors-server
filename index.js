const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middeleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_Uesr}:${process.env.DB_Password}@cluster0.x1smjlm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Custom Middlware
const VerifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token){
    return res.status(401).send({message: 'unAuthorized User'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unAuthorized User'})
    }
    req.user =decoded
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // ---------------------------------------------------------------------------------------------------------------------
    const database = client.db("CarsDoctor");
    const serviceCollection = database.collection("CarsServices");

    // auth related API
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '2h' })

      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,
        })
      .send({ success: true })
    })

    // auth related API


    app.get('/services', async (req, res) => {
      const cursor = serviceCollection.find()
      const result = await cursor.toArray()

      res.send(result);
    })
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await serviceCollection.findOne(query)


      res.send(result);
    })
    app.get('/services/process/:service_id', async (req, res) => {
      const service_id = req.params.service_id;
      const query = { service_id: service_id }
      const options = { projection: { _id: 0, title: 1, price: 1, img: 1 } }
      const result = await serviceCollection.findOne(query, options)
      res.send(result);
    })

    // ---------------------------------------------------------------------------------------------------------------------
    // ****************************************** Bookings Related ********************************************************
    // ---------------------------------------------------------------------------------------------------------------------
    const BookingCollection = client.db("CarsDoctor").collection("Bookings");

    app.get('/bookings', VerifyToken, async (req, res) => {
      console.log(req.query.email);
      console.log('ttttt token', req.cookies)
      
      if(req.query.email !== req.user.email ){
        return res.status(403).send({message: 'Forbidden User'})
      }

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await BookingCollection.find(query).toArray();
      res.send(result)

    })



    app.post('/bookings', async (req, res) => {
      const result = await BookingCollection.insertOne(req.body)
      res.send(result)
    })

    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await BookingCollection.deleteOne(query);
      res.send(result)

    })
    // ---------------------------------------------------------------------------------------------------------------------
    // ****************************************** Bookings Related ********************************************************
    // ---------------------------------------------------------------------------------------------------------------------

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Car Dorctor Running------------')
})

app.listen(port, () => {
  console.log(`Car Dorctor Server is Running on PORT: ${port}`);

})