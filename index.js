  const express = require('express');
  const bodyParser = require('body-parser');
  const cors = require('cors');
  const { check, validationResult } = require('express-validator');
  const mongoose = require('mongoose');
  const Models = require('./models.js');
  const passport = require('passport');
  require('./passport');
  const auth = require('./auth');
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');


  const Movies = Models.Movie;
  const Users = Models.User;
  const Genres = Models.Genre;

  mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database Connected Successfully'))
    .catch(err => console.error('Database Connection Failed', err));


  const db = mongoose.connection;

  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log('We are connected to the database');
  });

  const app = express();

  //Middleware
  app.use(cors());
  app.use(express.json());

  // Middleware per loggare le richieste
  app.use((req, res, next) => {
    console.log('Request:', req.method, req.path);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
  });

  app.use(passport.initialize());
  auth(app);

  const router = express.Router();
  app.use('/', router);
  app.use(express.static('public'));

  // Authentication middleware for protected routes
  const authMiddleware = passport.authenticate('jwt', { session: false });

app.get('/movies', authMiddleware, (req, res) => {
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

app.get('/movies/:title', authMiddleware, (req, res) => {
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

app.get('/genres/:genreName', authMiddleware, (req, res) => {
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


app.get('/movies/director/:directorName', authMiddleware, (req, res) => {
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

app.get('/users', authMiddleware, (req, res) => {
  Users.find()
    .select('-password')
    .then(users => {
      res.json(users);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.post('/users',
  // Validation logic here for request
  // you can either use a chain of methods like .not().isEmpty()
  // which means "opposite of isEmpty" in plain English "is not empty"
  // or use .isLength({min: 5}) which means
  // minimum value of 5 characters are only allowed
  [
    check('username', 'Username is required').isLength({min: 5}),
    check('username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
    check('password', 'Password is required').not().isEmpty(),
    check('email', 'Email does not appear to be valid').isEmail()
  ], async (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.password);
    await Users.findOne({ username: req.body.username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          // If the user is found, send a response that it already exists
          return res.status(400).send(req.body.username + ' already exists');
        } else {
          Users
            .create({
              username: req.body.username,
              password: hashedPassword,
              email: req.body.email,
              birthday: req.body.birthday
            })
            .then((user) => {
              // Create a copy of the user object without the password
              const userWithoutPassword = { ...user._doc };
              delete userWithoutPassword.password;
              // Send the modified object
              res.status(201).json(userWithoutPassword);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });


  app.put('/users/:username',
  // Add validation checks here
  [
    check('username', 'Username must be at least 5 characters long').isLength({min: 5}),
    check('username', 'Username should contain only alphanumeric characters').isAlphanumeric(),
    check('password', 'Password must not be empty').optional().not().isEmpty(),
    check('email', 'Email must be valid').optional().isEmail(),
    check('birthday', 'Birthday must be a valid date').optional().isDate()
  ],
  authMiddleware,
  (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const usernameFromParams = req.params.username.trim();
    const usernameFromBody = req.body.username;
    const regex = new RegExp(`^${usernameFromParams}$`, 'i');

    if (usernameFromBody && usernameFromParams !== usernameFromBody) {
      return res.status(400).send('Username in the parameter does not match the one in the request body');
    }
    console.log('Updating user:', usernameFromParams); // Log for debugging
    console.log('Regex:', regex); // Log for debugging

    Users.findOne({ username: regex }) // Test query
        .select('-password') // Exclude password field
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

        // If a new password is provided, hash it
        if (req.body.password) {
          updateObj.password = Users.hashPassword(req.body.password);
        }

        // Assign the updated fields to the user object
        Object.assign(user, updateObj);

        // Save the updated user object
        user.save()
          .then(updatedUser => {
            const userWithoutPassword = { ...updatedUser._doc};
            delete userWithoutPassword.password;
            res.json(userWithoutPassword);
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

  app.post('/users/:username/movies/:movieTitle', authMiddleware, (req, res) => {
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

  app.post('/login', (req, res) => {
    Users.findOne({ username: req.body.username })
      .then((user) => {
        if (!user) {
          return res.status(400).send('Username not found');
        }
  
        if (!bcrypt.compareSync(req.body.password, user.password)) {
          return res.status(400).send('Password is incorrect');
        }
  
        const payload = { username: user.username };
        const token = jwt.sign(payload, 'Segreto', { expiresIn: '1h' });
  
        res.json({ user: user.username, token: token });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });
  

  app.delete('/users/:username/movies/:movieTitle', authMiddleware, (req, res) => {
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

app.delete('/users/:username', authMiddleware, (req, res) => {
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