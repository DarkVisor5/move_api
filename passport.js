const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

// LocalStrategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, callback) => {
      console.log(`Received username: ${username} and password: ${password}`);
      await Users.findOne({ username: username })
        .then((user) => {
          if (!user){
            console.log('incorrect username or password');
            return callback(null, false, { message: 'Incorrect username or password.' });
          }
          console.log('finished');
          return callback(null, user);
        })
        .catch((error) => {
          if (error){
            console.log(error);
            return callback(error);
          }
        });
    }
  )
);


// JWTStrategy
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
  return await Users.findById(jwtPayload._id)
    .then((user) => {
      return callback(null, user);
    })
    .catch((error) => {
      return callback(error);
    });
}));
