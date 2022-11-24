const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const app = express()
// const jwt = require('jsonwebtoken')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


//middle ware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kkoxxt5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        const categoryCollection = client.db('bookworms').collection('categories')
        const booksCollection = client.db('bookworms').collection('allbook')
        const bookingCollection = client.db('bookworms').collection('allbookings')

        app.get('/categories', async (req, res) => {
            const query = {}
            const result = await categoryCollection.find(query).toArray()
            res.send(result)
        })
        //-----------------allbook data -----------------------
        app.get('/allbook', async (req, res) => {
            const query = {}
            const result = await booksCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/allbook/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const result = await booksCollection.find(query).toArray();
            res.send(result);
        })

        //-------------------------booked products-----------------------
        app.get('/allbookings', async (req, res) => {
            const email = req.query.email
            // const decodedEmail = req.decoded.email
            // if(email !== decodedEmail){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const query = { email: email };
            // console.log(req.headers.authorization)
            const result = await bookingCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/allbookings', async (req, res) => {
            const booking = req.body
            const result = await bookingCollection.insertOne(allbookings)
            res.send(result)
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