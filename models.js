const mongoose = require('mongoose');

let genreModelSchema = mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, required: true}
});

let GenreModel = mongoose.model('Genre', genreModelSchema);

let movieSchema = mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    genre: [{type: mongoose.Schema.Types.ObjectId, ref: 'Genre'}], 
    director: {
        name: String,
        bio: String,
        birth: Date,
        death: Date
    },
    imagePath: String,
    featured: Boolean
});

let userSchema = mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    birthday: Date,
    favoriteMovies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports = { Movie, User, Genre: GenreModel };
