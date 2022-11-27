
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const app = express()
const jwt = require('jsonwebtoken');

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middle ware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kkoxxt5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const categoryCollection = client.db('bookworms').collection('categories')
        const booksCollection = client.db('bookworms').collection('allbook')
        const bookingCollection = client.db('bookworms').collection('allbookings')
        const usersCollection = client.db('bookworms').collection('users')
        const paymentsCollection = client.db('bookworms').collection('payments')
        const addCollection = client.db('bookworms').collection('adds')
        const reportCollection = client.db('bookworms').collection('reports')



        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await categoryCollection.find(query).toArray()
            res.send(result)

        })


        //-----------------all books data -----------------------
        app.get('/allbook', verifyJWT, async (req, res) => {

            const decodedEmail = req.decoded.email


            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const query = {}
            const result = await booksCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/allbook/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const result = await booksCollection.find(query).toArray();
            res.send(result);

            const name = req.query.name
            console.log(name)
        })


        app.post('/allbook', async (req, res) => {
            const item = req.body
            console.log(item)
            const result = await booksCollection.insertOne(item)
            res.send(result)
        })


        //-------------------------booked products-----------------------
        // app.get('/newbookings', async (req, res) => {
        //     const query = {}
        //     const result = await bookingCollection.find(query).toArray()
        //     res.send(result)
        // })


        app.get('/allbookings', async (req, res) => {
            const email = req.query.email
            // console.log(email)
            // const decodedEmail = req.decoded.email


            // if (email !== decodedEmail) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }

            const query = { email: email };
            // console.log(req.headers.authorization)
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/allbookings', async (req, res) => {
            const booking = req.body

            const query = { productName: booking.productName }
            const alreadyBooked = await bookingCollection.find(query).toArray()
            console.log(alreadyBooked)
            if (alreadyBooked.length) {
                const message = `This product is already booked`
                return res.send({ acknowledged: false, message })
            }


            const result = await bookingCollection.insertOne(booking)

            res.send(result)
        })

        //for payment

        app.get('/allbookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const booking = await bookingCollection.findOne(query)
            res.send(booking)
        })

        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const price = booking.SellingPrice;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        })

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        app.get('/payments', async (req, res) => {
            const query = {};
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })

        //jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;

            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10d' })
                return res.send({ accessToken: token });
            }

            res.status(403).send({ accessToken: '' })

        })




        //getting all users
        // app.get('/users', async (req, res) => {
        //     const query = {};
        //     const users = await usersCollection.find(query).toArray();
        //     res.send(users);
        // });



        // app.get('/users/:email', async (req, res) => {
        //     const id = req.params.email;
        //     // const decodedEmail = req.decoded.email
        //     // if(email !== decodedEmail){
        //     //     return res.status(403).send({message: 'forbidden access'})
        //     // }

        //     // console.log(req.headers.authorization)
        //     const query = { email: id };
        //     const users = await usersCollection.findOne(query);
        //     res.send(users);
        // });


        app.get('/users', async (req, res) => {
            const email = req.query.email
            // const decodedEmail = req.decoded.email
            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const query = { email: email };
            // console.log(req.headers.authorization)
            const result = await usersCollection.find(query).toArray()
            res.send(result)

        })

        //adding all users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            console.log(result)
            res.send(result);

        })

        //get only sellers
        app.get('/dashboard/allsellers', async (req, res) => {

            const query = {};
            const users = await usersCollection.find(query).toArray();

            const sellers = users.filter(user => user.role === 'seller')
            res.send(sellers);
        })



        //deleting sellers
        app.get('/users/allsellers/:id', async (req, res) => {

            const id = req.params.id;
            console.log()
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.findOne(query);
            res.send(result)

        })

        app.delete('/users/allsellers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })



        //get only buyers
        app.get('/dashboard/allbuyers', async (req, res) => {

            const query = {};
            const users = await usersCollection.find(query).toArray();
            const buyers = users.filter(user => user.role === 'buyer')
            res.send(buyers);
        })

        //deleting buyers
        app.get('/users/allbuyers/:id', async (req, res) => {

            const id = req.params.id;
            console.log()
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.findOne(query);
            res.send(result)

        })

        app.delete('/users/allbuyers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })


        app.get('/dashBoard/allbook', async (req, res) => {
            const email = req.query.email
            // const decodedEmail = req.decoded.email
            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const query = { email: email };
            // console.log(req.headers.authorization)
            const result = await booksCollection.find(query).toArray()
            res.send(result)
        })

        //for my addedproduct
        app.get('/dashboard/allbook/:id', async (req, res) => {
            const id = req.params.id;
            console.log()
            const query = { _id: ObjectId(id) };
            const result = await booksCollection.findOne(query);
            res.send(result)

        })

        app.delete('/dashboard/allbook/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await booksCollection.deleteOne(query);
            res.send(result)
        })


        //make advertise
        app.get('/makeadd', async (req, res) => {
            const query = {};
            const result = await addCollection.find(query).toArray()
            res.send(result);
        })

        app.post('/makeadd', async (req, res) => {
            const user = req.body;
            const result = await addCollection.insertOne(user)
            res.send(result);
        })



        app.get('/report', async (req, res) => {
            const query = {};
            const result = await reportCollection.find(query).toArray()
            res.send(result);
        })
        app.post('/report', async (req, res) => {
            const user = req.body;
            const result = await reportCollection.insertOne(user)
            res.send(result);
        })
        app.delete('/dashboard/report/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reportCollection.deleteOne(query);
            res.send(result)
            console.log(id)
        })
    }
    finally {

    }
}
run().catch(err => console.log(err))


app.get('/', (req, res) => {
    res.send('bookworms server is running')
})

app.listen(port, () => {
    console.log(`bookworms server is running ${port}`)
})