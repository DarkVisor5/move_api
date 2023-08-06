const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

// Connect to your MongoDB database
mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(morgan('common'));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Movie API!');
});

app.get('/movies', (req, res) => {
  Movies.find()
    .then(movies => {
      res.json(movies);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.get('/movies/:title', (req, res) => {
  Movies.findOne({ Title: req.params.title })
    .then(movie => {
      if (!movie) {
        res.status(404).send('Movie not found');
      } else {
        res.json(movie);
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.get('/genres/:genreName', (req, res) => {
  Movies.findOne({ 'Genre.Name': req.params.genreName })
    .then(movie => {
      res.json(movie.Genre);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.get('/directors/:name', (req, res) => {
  Movies.findOne({ 'Director.Name': req.params.name })
    .then(movie => {
      res.json(movie.Director);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.post('/users', (req, res) => {
  const newUser = req.body;

  // Here, you can implement your user validation logic

  Users.findOne({ Username: newUser.Username })
    .then(user => {
      if (user) {
        return res.status(400).send('User already exists');
      } else {
        Users
          .create({
            Username: newUser.Username,
            Password: newUser.Password,
            Email: newUser.Email,
            Birthday: newUser.Birthday
          })
          .then(user => {
            res.status(201).json(user);
          })
          .catch(error => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.put('/users/:username', (req, res) => {
  const updatedUser = req.body;
  const username = req.params.username;

  Users.findOneAndUpdate({ Username: username }, updatedUser, { new: true })
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.post('/users/:username/favorites/:movieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.username }, {
    $push: { FavoriteMovies: req.params.movieID }
  }, { new: true })
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.delete('/users/:username/movies/:movieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.username }, {
    $pull: { FavoriteMovies: req.params.movieID }
  }, { new: true })
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.delete('/users/:username', (req, res) => {
  Users.findOneAndRemove({ Username: req.params.username })
    .then(user => {
      if (!user) {
        res.status(400).send('User not found');
      } else {
        res.status(200).send('User ' + req.params.username + ' was deleted.');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).send({ message: err.message || 'Something went wrong!' });
});

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
