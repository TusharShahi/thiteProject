let express = require('express');
let app = express();
let http = require('http').Server(app);
let mongoose = require('mongoose');
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let bodyParser = require('body-parser');
let session = require('express-session');
let _ = require('lodash');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))


app.use(session({ secret: 'tusharshahi' }));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'pug')


const dbUrl = 'mongodb://tusharshahi:password8@ds155294.mlab.com:55294/patientchatapp'
mongoose.connect(dbUrl ,(err) => {

  console.log('mongodb connected',err);
})
  
let Patient = mongoose.model('Patient',{
  name : String,
  password : String,
  patientId : String,
  doctorName : String,
  age : Number,
  gender : String 
},"Patients");


const Doctor = mongoose.model('Doctor',{
  name : String,
  password : String,
  doctorId : String,
  age : Number,
  gender : String,
  department : String 
});


let patients = null;

  
  

  passport.use('patient-local',new LocalStrategy(
    function(username, password, done) {
      Patient.find({'name' : username}, function (err, user) {
        if (err) { console.log(err); return done(err); }
        if (!user) { return done(null, false); }
        if (user && user.password == password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  passport.use('doctor-local',new LocalStrategy(
    function(username, password, done) {
      Doctor.findOne({ name: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (user && user.password == password) { return done(null, false); }
          return done(null, user);
      });
    }
  ));



  passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// used to deserialize the user
/*passport.deserializeUser(function(id, done) {
  if (isPatient(user)) {  
    Doctor.findById(id, function(err, user) {
      done(err, user);
  });
  } else if (isDoctor(user)) {
    Patient.findById(id, function(err, user) {
      done(err, user);
  });
 
  }  
 
});*/


  const isPatient = (user) => {
    if(!_.isNil(user.patientId))
    {
      return true;
    }
  };

  const isDoctor = (user) => {
    if(!_.isNil(user.doctorId))
    {
      return true;
    }
  };

  app.get("/home",(req,res,next)=>{

    if(!_.isNil(req.user)){
     if(!_.isNil(req.user.department))
     {
        res.redirect("/doctorPage");
     }
     else{
        res.redirect("/patientPage");
     }
    }
    else {
        res.redirect("/enterPage")
    }
  });

  app.get("/enterPage",(req,res,next)=>{

    if(!_.isNil(req.user)){
        if(!_.isNil(req.user.department))
        {
           res.redirect("/doctorPage");
        }
        else{
           res.redirect("/patientPage");
        }
       }
       else {
            res.render('enterPage');

    }


  });
  

  app.post("/patientLogin",
  passport.authenticate('patient-local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/patientHome');
  });
  
  app.get("/patientHome",(req,res,next)=>{
    res.send("hey");
  });
  
  
  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });
  
  let server = http.listen(3000, () => {
    console.log('server is running on port', 3000);
  });
