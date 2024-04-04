require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');
const { client } = require('./database/mongodb')
const app = express();

app.use(cookieParser());

const join = require('path').join;

const port = process.env.PORT;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '7mb' }));

app.use(cors());
app.use(express.static(__dirname));

app.get('/hello', async (req,res) => {
    res.send('<h1> <b>Hello GDSC</b> </h1>');
});

app.get('/api/hello', async (req,res) => {
    res.status(200).json({message: 'Hello GDSC'});
});

app.get('/bookstore', async (req,res) => {
    try{
        await client.connect();
        console.log('Connected to database');
        const collection = client.db('gdsc').collection('db');
        const books = await collection.find({}).toArray();
        res.status(200).json(books);
        
      } catch (err){
        console.error('Error: ',err);
        res.status(500).json({error: err});
      } finally {
        await client.close();
      }
})
/*
app.post('/bookstore', async (req,res) => {
    try{
        await client.connect();
        console.log('Connected to database');
        const collection = client.db('gdsc').collection('db');
        const time = new Date().toLocaleString();

        const updateFields = {
            author: 'John Joe',
            title: 'Chapter Of Life',
            date_uploaded: time,
            author_email: 'johnjoe@gmail.com',
            book_cover: 'chapter-of-life.jpg',
            verified: true,
            isbn: "978-0-7432-7356-5",
            publisher: "Life Publishers",
            publication_date: "1925-04-10",
            genres: ["Memoir", "Self-Help"],
            description: "Chapter Of Life is a memoir written by John Joe that reflects on personal experiences, challenges, and lessons learned throughout life's journey.",
            language: "English",
            page_count: 180,
            availability: true,
            format: "Hardcover",
            price: 24.99,
            reviews: [
                {
                  user: "BookLover123",
                  rating: 4.8,
                  comment: "An inspiring and thought-provoking memoir. Highly recommended!"
                },
                {
                    user: "ReadingFanatic",
                    rating: 5,
                    comment: "A beautifully written book that touches the heart. Couldn't put it down!"
                }
              ],
              related_books: [
                {
                    title: "The Power of Now",
                    author: "Eckhart Tolle"
                },
                {
                    title: "Becoming",
                    author: "Michelle Obama"
                }
              ]
        };

        // await collection.insertOne( updateFields );
        console.log('Successfully added to the database')

    } catch (err){
        console.error('Error: ',err);
        res.status(500).json({error: err});
    } finally {
        await client.close();
    }
});*/

app.get('/', async (req,res) => {
    res.redirect('/hello');
})

// 
app.listen(port, () => {
    console.log(`Server running on ${port}/`);
});