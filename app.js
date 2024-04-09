require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const ejs = require('ejs');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const validator = require('validator');
const ObjectID = require('mongodb').ObjectId;
const { client } = require('./database/mongodb')
const app = express();

app.use(cookieParser());

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const join = require('path').join;

const port = process.env.PORT;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '7mb' }));

app.use(cors());
app.use(express.static(__dirname));

function secretKeyy(e){
    const secretKey = crypto.randomBytes(e).toString('hex');
    return secretKey;
}

app.get('/hello', async (req,res) => {
    res.send('<h1> <b>Hello GDSC</b> </h1>');
});

app.get('/api/hello', async (req,res) => {
    res.status(200).json({message: 'Hello GDSC'});
});

app.get('/accounts/authors', async(req,res) => {
    res.render('account');
});

app.get('/bookstore', async(req,res) => {
    res.render('bookstore');
});

app.get('/accounts/signin', async (req,res) => {
    res.render('signin');
})

app.get('/dashboard/:key', async(req,res) => {
    await client.connect();
    console.log('Connected to database');

    const key = req.params.key;
    const authors = client.db('gdsc').collection('authors');
    const author = await authors.findOne( { key: key } );
    if(!key || !author){
        return res.redirect(`/accounts/signin`);
    }
    const { firstname = '', lastname = '', fullname = '', email = ''} = author || {};
    res.render('dashboard', {
        key: key,
        firstname: firstname,
        lastname: lastname,
        fullname: fullname,
        email: email
    });
});

app.get('/dashboard/:key/uploadbook', async(req,res) => {
    await client.connect();
    console.log('Connected to database');

    const key = req.params.key;
    const authors = client.db('gdsc').collection('authors');
    const author = await authors.findOne( { key: key } );
    if(!key || !author){
        return res.redirect(`/dashboard/:${key}`);
    }
    const { firstname = '', lastname = '', fullname = '', email = ''} = author || {};
    res.render('uploadbook', {
        key: key,
        firstname: firstname,
        lastname: lastname,
        fullname: fullname,
        email: email
    });
});

app.post('/accounts/signin', async (req,res) => {
    try{
        await client.connect();
        console.log('Connected to database');
        const authors = client.db('gdsc').collection('authors');
        const { email, password } = req.body;

        if (!validator.isEmail(email)) {
            console.log(`Received an invalid email: ${email}`);
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const author = await authors.findOne({ email: email });
        if(!author){
            if(!email){
            return res.status(404).json({ error: 'Wrong email'});
            }
            // Compare the provided password with the hashed password from the database
            const passwordMatch = await bcrypt.compare(password, user.password);
            // If passwordMatch is false, it means the password does not match
            if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
            };
        }
        const key = secretKeyy(5);
        
        await authors.updateOne(
            { email: email },
            { $set: { key: key}}
        );

        return res.redirect(`/dashboard/${key}`);
    }catch(err){
        console.error('Error: ',err);
        res.status(500).json({error: err});
    }finally{
        await client.close();
    }
});

app.post('/accounts/authors', async (req,res) => {
    try{
        await client.connect();
        console.log('Connected to database');
        const authors = client.db('gdsc').collection('authors');
        
        const { firstname, lastname, email, author_image, password} = req.body;
        const fullname = `${firstname} ${lastname}`
        const saltRounds = 10;
        const time = new Date().toLocaleString();

        // Validate the email address
        if (!validator.isEmail(email)) {
            console.log(`Received an invalid email: ${email}`);
            
            return res.status(400).json({ error: 'Invalid email address' });
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Check if the username or email already exists in the collection
        const result = await authors.findOne( { email: email } );
        if(result){
            return res.status(400).json({ error: 'Author already exists.' });
        }

        await authors.insertOne({
            time: time,
            firstname: firstname,
            lastname: lastname,
            fullname: fullname,
            email: email,
            password: hashedPassword,
            displayPicture: author_image,
            verified: false
        });

        return res.status(200).json({message: 'Author account created.'});


    } catch (err){
        console.error('Error: ',err);
        res.status(500).json({error: err});
    } finally {
        await client.close();
    }
});

// Endpoint to view the books avaialable
app.get('/bookstore/getbooks', async (req,res) => {
    try{
        const key = req.query.key;
        // console.log(key, '164')
        await client.connect();
        console.log('Connected to database');
        const collection = client.db('gdsc').collection('db');
        let books;
        if(key){
            books = await collection.find( { author_email: key } ).toArray();
            // console.log(books, '170');
            if (!books || books.length === 0) {
                return res.status(404).json({ error: 'No books uploaded by you' });
            }
            return res.status(200).json(books);
        } else {
            books = await collection.find({}).toArray();
            return res.status(200).json(books);
        }
        
      } catch (err){
        console.error('Error: ',err);
        res.status(500).json({error: err});
      } finally {
        await client.close();
      }
})

// Endpoint that handles creation of books
app.post('/bookstore/createbook', async (req,res) => {
    try{
        const key = req.query.key;
        // console.log(key)
        await client.connect();
        console.log('Connected to database');
        const authors = client.db('gdsc').collection('authors');
        const author = await authors.findOne( { key: key } );
        const collection = client.db('gdsc').collection('db');
        const time = new Date().toLocaleString();
        const id = secretKeyy(8);

        const { name, title, email, displayPicture, isbn, publisher, publication_date, genres, book_description, language, no_of_pages, availability, format, price, review} = req.body;

        if(!author){
            return res.status(404).json({ error: 'Author not found'});
        }

        const updateFields = {
            _id: id,
            author: name,
            title: title,
            date_uploaded: time,
            author_email: email,
            book_cover: displayPicture,
            verified: true,
            isbn: isbn,
            publisher: publisher,
            publication_date: publication_date,
            genres: genres,
            description: book_description,
            language: language,
            page_count: no_of_pages,
            availability: true,
            format: format,
            price: price,
            noOfUpdates: 0
        };

        await collection.insertOne( updateFields );
        console.log('Successfully added to the database');
        return res.redirect(`/dashboard/${key}`)

    } catch (err){
        console.error('Error: ',err);
        res.status(500).json({error: err});
    } finally {
        await client.close();
    }
});

// Endpoint to handle deletion of books
app.delete('/bookstore/deletebook', async (req,res) => {
    try{
        await client.connect();
        console.log('Connected to database');
        const authors = client.db('gdsc').collection('authors');
        const collection = client.db('gdsc').collection('db');
        const time = new Date().toLocaleString();
        const { bookid, key} = req.query;
        const objectId = new ObjectID(bookid);

        const author = await authors.findOne({key: key });
        if(author){
            const deletedItem = await collection.findOneAndDelete({_id: objectId });
            if (!deletedItem) {
                return res.status(404).json('Book not found');
            }
            return res.status(200).json('Book has been deleted');
        } else{
            return res.status(404).json( "You don't have access to delete this book.");
        }
    } catch (err){
        console.error('Error: ',err);
        res.status(500).json({error: err});
    } finally {
        await client.close();
    }
});

app.put('/bookstore/updatebook', async(req,res) => {
    try {
        const key = req.query.key;
        // console.log(req.body)
        const [ title, author, publication_date, email, isbn, genres, publisher, book_description, no_of_pages, availability, format, price ] = req.body;
        await client.connect();
        const collection = client.db('gdsc').collection('db');
        const book = await collection.findOne({_id: key});
        const time = new Date().toLocaleString();

        const updateFields = {
            title: title.title,
            author: author.author,
            publication_date: publication_date.publication_date,
            author_email: email.email,
            isbn: isbn.isbn, // Set to false to trigger email confirmation
            genres: genres.genres,
            publisher: publisher.publisher,
            description: book_description.book_description,
            page_count: parseInt(no_of_pages.no_of_pages),
            availability: availability.availability,
            format: format.format,
            price: parseFloat(price.price),
            lastUpdate: time
        };
        // console.log(updateFields)

        // Only update the fields that need to be changed
        await collection.updateOne(
            { _id: key }, // Filter to find the existing document
            { $set: updateFields, $inc: { noOfUpdates: 1 } },
            { upsert: false }  
        );
        return res.status(200).json('Update Success');

    } catch (err){
        console.error('Error: ',err);
        res.status(500).json({error: err});
    } finally {
        await client.close();
    }
})

app.get('/', async (req,res) => {
    res.redirect('/hello');
})

// 
app.listen(port, () => {
    console.log(`Server running on ${port}/`);
});