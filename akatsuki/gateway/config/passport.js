const passport = require("passport");
const User = require("../models/User");

// passport-local-mongoose provides a ready-made LocalStrategy off the User model.
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

module.exports = passport;
