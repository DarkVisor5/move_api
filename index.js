const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
require('./passport');
const auth = require('./auth');
const Models = require('./models.js');

const movies = Models.movie;
const Users = Models.User;
const Genres = Models.Genre;

/**
 * Connects to the MongoDB database using the URI provided in the environment variables.
 * Logs the connection status to the console.
 */
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database Connected Successfully'))
  .catch(err => console.error('Database Connection Failed', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('We are connected to the database');
});

/**
 * Initializes the Express application.
 */
const app = express();

/**
 * Applies JSON and URL-encoded parsers as middleware to parse the body of incoming requests.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
auth(app);

/**
 * Middleware for logging requests.
 */
app.use((req, res, next) => {
  console.log('Request:', req.method, req.path);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

/**
 * Fetches all movies from the database.
 * See also:
 * - {@link getMovieByTitle} to fetch a single movie by title.
 * @returns {Object[]} movies - Returns an array of movie objects.
 */
app.get('/movies', (req, res) => {
  movies.find().populate('genre')
    .then(movies => {
      res.json(movies);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * GET /movies/:title
 * Fetches a single movie by its title.
 * 
 * @param {string} title - The title of the movie to search for in the database.
 * @returns {Object|Error} movie - Returns a single movie object populated with genre details, or an error if not found.
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
  movies.findOne({ title: { $regex: new RegExp("^" + req.params.title.toLowerCase(), "i") } })
    .populate('genre')
    .then(movie => {
      if (!movie) {
        res.status(404).send('No movie found');
      } else {
        res.json(movie);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


/**
 * GET /genres/:genreName
 * Fetches a genre by its name.
 * @param {string} genreName - Name of the genre to find.
 * @returns {Object} genre - Returns a genre object.
 */
app.get('/genres/:genreName', passport.authenticate('jwt', { session: false }), (req, res) => {
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
  
  
  /**
 * GET /movies/director/:directorName
 * Fetches details of a movie by the director's name.
 * @param {string} directorName - Name of the director to find.
 * @returns {Object} movieDetails - Returns detailed information about the director and their movies.
 */
app.get('/movies/director/:directorName', authMiddleware, (req, res) => {
  Movies.findOne({ 'director.name': { $regex: new RegExp(req.params.directorName, "i") } })
    .then(movie => {
      if (movie && movie.director) {
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

/**
 * GET /users
 * Fetches all users, excluding password details.
 * @returns {Object[]} users - Returns an array of user objects without passwords.
 */
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
  
 /**
 * POST /users
 * Creates a new user if the username does not already exist. The request body must contain
 * username, password, email, and birthday. It validates the data before creating the user.
 * @param {Object} req.body - The user details.
 * @param {string} req.body.username - The user's desired username.
 * @param {string} req.body.password - The user's password.
 * @param {string} req.body.email - The user's email address.
 * @param {Date} req.body.birthday - The user's birthday.
 * @returns {Object} user - Returns the newly created user object without the password, or an error message if validation fails.
 */
app.post('/users', [
  check('username', 'Username is required').isLength({min: 5}),
  check('username', 'Username contains non-alphanumeric characters - not allowed.').isAlphanumeric(),
  check('password', 'Password is required').not().isEmpty(),
  check('email', 'Email does not appear to be valid').isEmail()
], async (req, res) => {
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.password);
  await Users.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.username + ' already exists');
      } else {
        Users.create({
          username: req.body.username,
          password: hashedPassword,
          email: req.body.email,
          birthday: req.body.birthday
        })
        .then((user) => {
          const userWithoutPassword = { ...user._doc };
          delete userWithoutPassword.password;
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


/**
 * PUT /users/:username
 * Updates user details based on the provided username.
 * @param {string} username - Username to update.
 * @param {Object} req.body - The fields to update, which may include username, password, email, birthday, and favoriteMovies.
 * @returns {Object} user - Returns the updated user object without the password.
 */
app.put('/users/:username', [
  check('username', 'Username must be at least 5 characters long').isLength({min: 5}),
  check('username', 'Username should contain only alphanumeric characters').isAlphanumeric(),
  check('password', 'Password must not be empty').optional().not().isEmpty(),
  check('email', 'Email must be valid').optional().isEmail(),
  check('birthday', 'Birthday must be a valid date').optional().isDate()
], authMiddleware, (req, res) => {
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

  Users.findOne({ username: regex })
    .select('-password')
    .then(user => {
      if (!user) {
        return res.status(400).send(`User with username ${usernameFromParams} not found (Test Query).`);
      }

      let updateObj = {
        username: req.body.username || user.username,
        password: req.body.password || user.password,
        email: req.body.email || user.email,
        birthday: req.body.birthday || user.birthday,
        favoriteMovies: req.body.favoriteMovies || user.favoriteMovies
      };

      if (req.body.password) {
        updateObj.password = Users.hashPassword(req.body.password);
      }

      Object.assign(user, updateObj);

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
  
    /**
 * POST /users/:username/movies/:movieTitle
 * Adds a movie to a user's list of favorite movies.
 * @param {string} username - Username of the user to update.
 * @param {string} movieTitle - Title of the movie to add to favorites.
 * @returns {Object} user - Returns the updated user object with the new list of favorite movies.
 */
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

/**
 * DELETE /users/:username/movies/:movieTitle
 * Removes a movie from a user's list of favorite movies.
 * @param {string} username - Username of the user to update.
 * @param {string} movieTitle - Title of the movie to remove from favorites.
 * @returns {Object} user - Returns the updated user object after removing the movie from favorites.
 */
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

/**
 * DELETE /users/:username
 * Deletes a user from the database.
 * @param {string} username - Username of the user to delete.
 * @returns {string} message - Confirmation message stating that the user was deleted.
 */
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

/**
 * Error handling middleware.
 * Catches and handles errors that occur during request processing.
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

  
/**
 * Starts the server on a specified port.
 * Listens on all network interfaces.
 * @param {number} [port=8080] - The port number on which the server will listen. Defaults to 8080 if not specified.
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
