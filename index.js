const express = require('express');
const morgan = require('morgan');
const app = express();
const port = 8080;

let topMovies = [
    {
      title: 'Harry Potter and the Sorcerer\'s Stone',
      author: 'J.K. Rowling'
    },
    {
      title: 'Lord of the Rings',
      author: 'J.R.R. Tolkien'
    },
    {
      title: 'Twilight',
      author: 'Stephanie Meyer'
    }
  ];

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

app.get('/', (req, res) => {
    res.send('Welcome to the Movie API!');
});

app.use(express.static('public'));
app.use(morgan('combined'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
  });
  app.get('/error', (req, res, next) => {
    const error = new Error('This is a test error');
    next(error);
  });
  



app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
  });

