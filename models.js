    const mongoose = require('mongoose');
    const bcrypt = require('bcrypt');

    const GenreSchema = mongoose.Schema({
        name: {type: String, required: true},
        description: {type: String, required: true}
    });

    const Genre = mongoose.model('Genre', GenreSchema, 'genres');

    const MovieSchema = mongoose.Schema({
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

    const Movie = mongoose.model('Movie', MovieSchema, 'movies');

    const UserSchema = mongoose.Schema({
        username: {type: String, required: true},
        password: {type: String, required: true},
        email: {type: String, required: true},
        birthday: Date,
        favoriteMovies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
    });

    UserSchema.statics.hashPassword = (password) => {
        return bcrypt.hashSync(password, 10);
    };

    UserSchema.methods.validatePassword = function(password) {
        return bcrypt.compareSync(password, this.password);
    };

    const User = mongoose.model('User', UserSchema, 'users');

    module.exports = { Movie, User, Genre };
