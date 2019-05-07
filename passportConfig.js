let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let models =  require("./models");

const Patient = models.Patient;
const Doctor = models.Doctor;
const Admin = models.Admin;


passport.use('patient-local', new LocalStrategy(
    function (userName, password, done) {
      Patient.findOne({ userName: userName }, function (err, user) {
        if (err) { console.log(err); return done(err); }
        if (!user) { return done(null, false, { message: 'User does not exist' }); }
        if (user && user.password != password) { return done(null, false, { message: 'Password is incorrect' }); }
        return done(null, user);
      });
    }
  ));
  
  passport.use('doctor-local', new LocalStrategy(
    function (userName, password, done) {
      Doctor.findOne({ userName: userName }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'User does not exist' }); }
        if (user && user.password != password) { return done(null, false, { message: 'Password is incorrect' }); }
        return done(null, user);
      });
    }
  ));
  
  passport.use('admin-local', new LocalStrategy(
    function (userName, password, done) {
      Admin.findOne({ userName: userName }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Admin does not exist' }); }
        if (user && user.password != password) { return done(null, false, { message: 'Password is incorrect' }); }
        return done(null, user);
      });
    }
  ));
  
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function (user, done) {
    done(null, user);
  });
  

module.exports =   {
     passport : passport
    };