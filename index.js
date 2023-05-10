const express = require('express');
const morgan = require('morgan');
const app = express();
const port = 8080;
const movies = require('./data/movies');
const users = require('./data/users');
const directors = require('./data/directors');

function validateUserData(user) {
  const { username, email, password } = user;

  if (!username || !email || !password) {
    return { isValid: false, message: 'Username, email, and password are required.' };
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Invalid email format.' };
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    return { isValid: false, message: 'Password must be at least 8 characters long, contain at least one letter and one number.' };
  }

  return { isValid: true };
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to the Movie API!');
});

app.get('/movies', (req, res) => {
  res.json(movies);
});

app.get('/movies/:title', (req, res) => {
  const movie = movies.find(m => m.title.toLowerCase() === req.params.title.toLowerCase());
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).send('Movie not found');
  }
});

app.get('/genres/:genreName', (req, res) => {
  const genreName = req.params.genreName.toLowerCase();
  const genreMovies = movies.filter(movie => movie.genre.toLowerCase().includes(genreName));

  if (genreMovies.length > 0) {
    const response = {
      genre: genreName,
      description: 'A brief description of the genre',
      movies: genreMovies
    };
    res.json(response);
  } else {
    let errorResponse = {"message" : "Genre not found"};
    res.status(404).send(errorResponse);
  }
});

app.get('/directors/:name', (req, res) => {
  const directorName = req.params.name.toLowerCase();
  const director = directors.find(d => d.name.toLowerCase() === directorName);

  if (director) {
    res.json(director);
  } else {
    res.status(404).send('Director not found');
  }
});

app.post('/users', (req, res) => {
  const newUser = req.body; 

  const validation = validateUserData(newUser);
  if (!validation.isValid) {
    res.status(400).send(validation.message);
    return;
  }

  newUser.favoriteMovies = [];
  users.push(newUser);
  res.status(201).json(newUser);
});



app.put('/users/:username', (req, res) => {
  const updatedUser = req.body;
  const urlUsername = req.params.username;

  // Check if the username in the URL and request body match
  if (urlUsername !== updatedUser.username) {
    res.status(400).send('URL username and request body username do not match');
    return;
  }

  const index = users.findIndex(u => u.username === urlUsername);
  if (index !== -1) {
    users[index] = updatedUser;
    res.status(200).json(updatedUser);
  } else {
    res.status(404).send('User not found');
  }
});


app.post('/users/:username/favorites/:movieTitle', (req, res) => {
  console.log('Adding movie to favorites');
  const username = req.params.username;
  const movieTitle = req.params.movieTitle;
  
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  const movie = movies.find(m => m.title.toLowerCase() === movieTitle.toLowerCase());

  if (!user) {
    res.status(404).send('User not found');
  } else if (!movie) {
    res.status(404).send('Movie not found');
  } else {
    const isAlreadyInFavorites = user.favoriteMovies.some(favMovie => favMovie.title.toLowerCase() === movieTitle.toLowerCase());
    if (isAlreadyInFavorites) {
      res.status(409).send('Movie is already in the favorites list');
    } else {
      user.favoriteMovies.push(movie);
      res.status(201).json(movie);
    }
  }
});

app.delete('/users/:email', (req, res) => {
  const index = users.findIndex(u => u.email === req.params.email);
  if (index !== -1) {
    users.splice(index, 1);
    res.status(200).send('User removed');
  } else {
    res.status(404).send('User not found');
  }
});

app.delete('/users/:username/favorites/:movieTitle', (req, res) => {
  const username = req.params.username;
  const movieTitle = req.params.movieTitle;

  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  const movie = movies.find(m => m.title.toLowerCase() === movieTitle.toLowerCase());

  if (!user) {
    res.status(404).send('User not found');
  } else if (!movie) {
    res.status(404).send('Movie not found');
  } else {
    const movieIndex = user.favoriteMovies.findIndex(favMovie => favMovie.title.toLowerCase() === movieTitle.toLowerCase());
    if (movieIndex === -1) {
      res.status(404).send('Movie not in the favorites list');
    } else {
      user.favoriteMovies.splice(movieIndex, 1);
      res.status(200).send('Movie removed from favorites');
    }
  }
});


app.use(express.static('public'));
app.use(morgan('combined'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).send({ message: err.message || 'Something went wrong!' });
});


app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});

