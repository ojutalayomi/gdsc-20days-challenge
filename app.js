require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());

const join = require('path').join;

const port = process.env.PORT;

app.use(express.static(path.join(__dirname, '../public')));

app.use(express.static(__dirname));

// 
app.listen(port, () => {
    console.log(`Server running on ${port}/`);
});