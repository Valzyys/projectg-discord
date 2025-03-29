// server.js - Main Express server file
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'discord-login-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 * 60 * 24 } // 24 hours
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Discord Strategy
passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
  scope: ['identify', 'guilds', 'relationships']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Store user data in session
    const user = {
      id: profile.id,
      username: profile.username,
      discriminator: profile.discriminator,
      avatar: profile.avatar,
      guilds: profile.guilds,
      relationships: profile.relationships,
      bio: profile.note || ''
    };
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

// Discord authentication route
app.get('/auth/discord', passport.authenticate('discord'));

// Discord callback route
app.get('/auth/discord/callback', 
  passport.authenticate('discord', { 
    failureRedirect: '/' 
  }), 
  (req, res) => {
    // Successful authentication, redirect to dashboard
    res.redirect('/dashboard');
  }
);

// Dashboard route
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
