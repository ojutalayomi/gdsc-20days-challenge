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
    try{
        await client.connect();
        console.log('Connected to database');
        const collection = client.db('gdsc').collection('db');
        res.send('<h1> <b>Hello GDSC</b> </h1>');

    } catch (err){
        console.error('Error: ',err);
        res.status(500).json({error: err});
    } finally {
        await client.close();
    }
});

app.get('/api/hello', async (req,res) => {
    res.status(200).json({message: 'Hello GDSC'});
});

app.get('/', async (req,res) => {
    res.redirect('/hello');
})

// 
app.listen(port, () => {
    console.log(`Server running on ${port}/`);
});