const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { check, validationResult } = require('express-validator');

const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;

mongoose.connect('mongodb://127.0.0.1/movies', { useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => console.log('Database Connected Successfully'))
  .catch(err => console.error('Database Connection Failed', err));


const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('We are connected to the database');
});

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cors());

app.get('/movies', (req, res) => {
  Movies.find()
    .populate('genre')
    .then(movies => {
      res.json(movies)
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/movies/:title', (req, res) => {
  Movies.findOne({ title: { $regex: new RegExp("^" + req.params.title.toLowerCase(), "i") } })
    .populate('genre')
    .then(movie => {
        res.json(movie);
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

app.get('/genres/:genreName', (req, res) => {
  Genres.findOne({ 'name': { $regex: new RegExp("^" + req.params.genreName.toLowerCase(), "i") } })
    .then(genre => {
      if (genre) {
        res.json(genre);
      } else {
        res.status(404).send('Genre not found');
      }
    })
    .catch(err => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});


app.get('/movies/director/:directorName', (req, res) => {
  Movies.findOne({ 'director.name': { $regex: new RegExp(req.params.directorName, "i") } })
    .then(movie => {
      if (movie && movie.director) {
        console.log('Birth:', movie.director.birth); // Log the birth date
        console.log('Death:', movie.director.death); // Log the death date
        res.json({
          name: movie.director.name,
          bio: movie.director.bio,
          birth_year: movie.director.birth ? movie.director.birth.getFullYear() : null,
          death_year: movie.director.death ? movie.director.death.getFullYear() : null
        });
      
      } else {
        res.status(404).send('No movie found by the director ' + req.params.directorName);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});





app.get('/users', (req, res) => {
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.post('/users', 
  [
    check('username').isAlphanumeric().isLength({ min: 3 }),
    check('password').isLength({ min: 5 })
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    Users.findOne({ username: req.body.username })
      .then(user => {
        if (user) {
          return res.status(400).send(req.body.username + ' already exists');
        } else {
          Users.create({
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            birthday: req.body.birthday
          })
          .then(user => { res.status(201).json(user) })
          .catch(err => {
            console.error(err);
            res.status(500).send('Error: ' + err);
          });
        }
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

  app.put('/users/:username', (req, res) => {
    const usernameFromParams = req.params.username.trim();
    const regex = new RegExp(`^${usernameFromParams}$`, 'i');
  
    console.log('Updating user:', usernameFromParams); // Log for debugging
    console.log('Regex:', regex); // Log for debugging
  
    Users.findOne({ username: regex }) // Test query
      .then(user => {
        if (!user) {
          return res.status(400).send(`User with username ${usernameFromParams} not found (Test Query).`);
        }
  
        // Fields you want to update
        let updateObj = {
          username: req.body.username || user.username,
          password: req.body.password || user.password,
          email: req.body.email || user.email,
          birthday: req.body.birthday || user.birthday,
          favoriteMovies: req.body.favoriteMovies || user.favoriteMovies
        };
  
        // Assign the updated fields to the user object
        Object.assign(user, updateObj);
  
        // Save the updated user object
        user.save()
          .then(updatedUser => {
            res.json(updatedUser);
          })
          .catch(err => {
            console.error(err);
            res.status(500).send('Error: ' + err);
          });
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

  app.post('/users/:username/movies/:movieTitle', (req, res) => {
    const username = req.params.username;
    const movieTitle = req.params.movieTitle;
  
    Movies.findOne({ title: movieTitle })
      .then(movie => {
        if (!movie) {
          return res.status(404).send('Movie not found');
        }
  
        return Users.findOneAndUpdate(
          { username: username },
          { $push: { favoriteMovies: movie._id } },
          { new: true }
        );
      })
      .then(updatedUser => {
        if (!updatedUser) {
          return res.status(404).send('User not found');
        }
  
        res.json(updatedUser);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });
  

  app.delete('/users/:username/movies/:movieTitle', (req, res) => {
    const username = req.params.username;
    const movieTitle = req.params.movieTitle;
  
    Movies.findOne({ title: movieTitle })
      .then(movie => {
        if (!movie) {
          return res.status(404).send('Movie not found');
        }
  
        return Users.findOneAndUpdate(
          { username: username },
          { $pull: { favoriteMovies: movie._id } },
          { new: true }
        );
      })
      .then(updatedUser => {
        if (!updatedUser) {
          return res.status(404).send('User not found');
        }
  
        res.json(updatedUser);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });  

app.delete('/users/:username', (req, res) => {
    Users.findOneAndRemove({ username: req.params.username })
      .then(user => {
        if (!user) {
          res.status(400).send(req.params.username + ' was not found');
        } else {
          res.status(200).send(req.params.username + ' was deleted.');
        }
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => console.log(`Server running on port ${port}`));