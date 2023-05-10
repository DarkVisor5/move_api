const express = require('express');
const morgan = require('morgan');
const app = express();
const port = 8080;

let topMovies = [
  {
    title: 'The Shawshank Redemption',
    description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
    genre: 'Drama',
    director: 'Frank Darabont',
    imageURL: 'https://example.com/shawshank-redemption.jpg',
    featured: true
  },
  {
    title: 'The Godfather',
    description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
    genre: 'Crime, Drama',
    director: 'Francis Ford Coppola',
    imageURL: 'https://example.com/the-godfather.jpg',
    featured: false
  },
  {
    title: 'Pulp Fiction',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    genre: 'Crime, Drama',
    director: 'Quentin Tarantino',
    imageURL: 'https://example.com/pulp-fiction.jpg',
    featured: true
  },
  {
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    genre: 'Action, Crime, Drama',
    director: 'Christopher Nolan',
    imageURL: 'https://example.com/the-dark-knight.jpg',
    featured: false
  },
  {
    title: 'Forrest Gump',
    description: 'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with an IQ of 75, whose only desire is to be reunited with his childhood sweetheart.',
    genre: 'Drama, Romance',
    director: 'Robert Zemeckis',
    imageURL: 'https://example.com/forrest-gump.jpg',
    featured: true
  },
  {
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    genre: 'Action, Adventure, Sci-Fi',
    director: 'Christopher Nolan',
    imageURL: 'https://example.com/inception.jpg',
    featured: false
  },
  {
    title: 'Fight Club',
    description: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into something much, much more.',
    genre: 'Drama',
    director: 'David Fincher',
    imageURL: 'https://example.com/fight-club.jpg',
    featured: true
  },
  {
    title: 'The Matrix',
    description: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
    genre: 'Action, Sci-Fi',
    director: 'Lana Wachowski, Lilly Wachowski',
    imageURL: 'https://example.com/the-matrix.jpg',
    featured: false
  },
  {
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    description: 'A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.',
    genre: 'Action, Adventure, Drama',
    director: 'Peter Jackson',
    imageURL: 'https://example.com/the-fellowship-of-the-ring.jpg',
    featured: true
},
{
    title: 'Interstellar',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    genre: 'Adventure, Drama, Sci-Fi',
    director: 'Christopher Nolan',
    imageURL: 'https://example.com/interstellar.jpg',
    featured: false
}
];

let users = [
  {
    username: 'john_doe',
    email: 'john_doe@example.com',
    password: 'password123',
    favoriteMovies: []
  },
  {
    username: 'jane_doe',
    email: 'jane_doe@example.com',
    password: 'password456',
    favoriteMovies: []
  },
  {
    username: 'movie_fan',
    email: 'movie_fan@example.com',
    password: 'password789',
    favoriteMovies: []
  }
];

let directors = [
  {
    name: 'Christopher Nolan',
    bio: 'Christopher Edward Nolan is a British-American film director, producer, and screenwriter.',
    birthYear: 1970,
    deathYear: null
  },
  {
    name: 'Quentin Tarantino',
    bio: 'Quentin Jerome Tarantino is an American film director, screenwriter, producer, and actor.',
    birthYear: 1963,
    deathYear: null
  },
  {
    name: 'Steven Spielberg',
    bio: 'Steven Allan Spielberg is an American film director, producer, and screenwriter.',
    birthYear: 1946,
    deathYear: null
  },
  {
    name: 'Martin Scorsese',
    bio: 'Martin Charles Scorsese is an American film director, producer, screenwriter, and actor.',
    birthYear: 1942,
    deathYear: null
  },
  {
    name: 'Francis Ford Coppola',
    bio: 'Francis Ford Coppola is an American film director, producer, and screenwriter.',
    birthYear: 1939,
    deathYear: null
  },
  {
    name: 'Peter Jackson',
    bio: 'Sir Peter Robert Jackson is a New Zealand film director, producer, and screenwriter.',
    birthYear: 1961,
    deathYear: null
  },
  {
    name: 'David Fincher',
    bio: 'David Andrew Leo Fincher is an American film director, producer, and screenwriter.',
    birthYear: 1962,
    deathYear: null
  },
  {
    name: 'Robert Zemeckis',
    bio: 'Robert Lee Zemeckis is an American film director, producer, and screenwriter.',
    birthYear: 1951,
    deathYear: null
  },
  {
    name: 'Lana Wachowski',
    bio: 'Lana Wachowski is an American film and television director, producer, and screenwriter.',
    birthYear: 1965,
    deathYear: null
  },
  {
    name: 'Lilly Wachowski',
    bio: 'Lilly Wachowski is an American film and television director, producer, and screenwriter.',
    birthYear: 1967,
    deathYear: null
  },
];

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
  res.json(topMovies);
});

app.get('/movies/:title', (req, res) => {
  const movie = topMovies.find(m => m.title.toLowerCase() === req.params.title.toLowerCase());
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).send('Movie not found');
  }
});

app.get('/genres/:name', (req, res) => {
  const genreName = req.params.name.toLowerCase();
  const genreMovies = topMovies.filter(movie => movie.genre.toLowerCase().includes(genreName));

  if (genreMovies.length > 0) {
    const response = {
      genre: genreName,
      description: 'A brief description of the genre',
      movies: genreMovies
    };
    res.json(response);
  } else {
    res.status(404).send('Genre not found');
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
  const username = req.params.username;
  const movieTitle = req.params.movieTitle;
  
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  const movie = topMovies.find(m => m.title.toLowerCase() === movieTitle.toLowerCase());

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

app.delete('/users/:username/favorites/:movieTitle', (req, res) => {
  const username = req.params.username;
  const movieTitle = req.params.movieTitle;

  const user = users.find(u => u.username === username);

  if (!user) {
    res.status(404).send('User not found');
  } else {
    const movieIndex = user.favoriteMovies.findIndex(m => m.title.toLowerCase() === movieTitle.toLowerCase());

    if (movieIndex === -1) {
      res.status(404).send('Movie not found in favorites');
    } else {
      user.favoriteMovies.splice(movieIndex, 1);
      res.status(200).send('Movie removed from favorites');
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

