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
  userName : String,
  fullName : String,
  password : String,
  patientId : String,
  doctorName : String,
  age : Number,
  gender : String 
},"Patients");


let Doctor = mongoose.model('Doctor',{
  userName : String,
  fullName : String,
  password : String,
  doctorId : String,
  age : Number,
  department : String 
}, "Doctors");

const Admin = mongoose.model('Admin',{
  name : String,
  password : String,
  userName : String
});

  

  passport.use('patient-local',new LocalStrategy(
    function(username, password, done) {
      Patient.findOne({userName : username}, function (err, user) {
        if (err) { console.log(err); return done(err); }
        if (!user) { return done(null, false); }
        if (user && user.password != password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  passport.use('doctor-local',new LocalStrategy(
    function(username, password, done) {
      Doctor.findOne({ userName: username }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (user && user.password != password) { return done(null, false); }
          return done(null, user);
      });
    }
  ));

  passport.use('admin-local',new LocalStrategy(
    function(username, password, done) {
      Admins.findOne({ userName: username }, function (err, user) {
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


  const userRedirect = function(req, res, next) {
    if(!_.isNil(req.user)){
      if(!_.isNil(req.user.department))
      {
         res.render("doctorHome",{doctorData : req.user});
         return ;
      }
      else{
         res.render("patientHome",{patientData : req.user});
         return ;
      }
     }
     else {
         res.render("enterPage");
        return ;
        } 
        next();
  };

  const checkIfDoctorExists = async function(req,res,next) {
  let doctor = await  Doctor.findOne({ userName: req.body.username });
  if(!_.isNil(doctor)){
    //req.flash('failure', {msg: 'Doctor with userName already exists'});
    res.redirect('/enterPage');
  }
  next();
  }
  
  const checkIfPatientExists = async function(req,res,next) {
    let patient = await Patient.findOne({ userName: req.body.username });
    if(!_.isNil(patient)){
      //req.flash('failure', {msg: 'Patient with userName already exists'});
      res.redirect('/');
    }
    next();
    }


  app.post("/patientLogin",
  passport.authenticate('patient-local', { failureRedirect: '/login' }),
  function(req, res) {
    res.render('patientHome',{patientData :req.user});
  });


  app.post("/doctorLogin",
  passport.authenticate('doctor-local', { failureRedirect: '/login' }),
  function(req, res) {
    res.render('doctorHome',{ doctorData : req.user});
  });

  
  app.get("/patientHome",(req,res,next)=>{
    res.send("hey");
  });
  
  app.post("/patientRegister",checkIfPatientExists,function(req,res){
    let data = {
        userName : req.body.username,
        fullName : req.body.fullName,
      password : req.body.password,
      age : req.body.age,
      gender : req.body.gender 
    };
  Patient.create(data, function (err) {
    if (err){
  return handleError(err);
      } 
      else{
        console.log("saved patient");
        res.render("patientHome",{ patientData : data});      } 
    })});
  
    app.post("/doctorRegister",checkIfDoctorExists,function(req,res){
      let data = {
        userName : req.body.username,
        fullName : req.body.fullName,
        password : req.body.password,
        age : req.body.age,
        department : req.body.department
      };
    Doctor.create(data, function (err) {
      if (err){
    return handleError(err);
        } 
        else{
          console.log("saved doctor");
          res.render("doctorHome",{ doctorData : data});
        } 
      })});


      /*app.get("/doctorHome",function(req,res) {
        if(req.user && req.user.department){

        }
        else{
          res.render("enterPage");
          return;
        }

      } );*/
  


  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });
  

  //Admin routes
/*
  app.get("/admin/homePage",
  isAdminLoggedIn, (req,res)=>{
    res.render("/adminHomePage");
  });

  app.get("/admin/settings",
  isAdminLoggedIn, (req,res)=>{
    res.render("/adminSettings");});

  app.post("/admin/assignDoctor",isAdminLoggedIn,async (req,res)=>
  {
    if(!_.isNil(req.body.patient) && !_.isNil(req.body.doctor)){
        let patientName = req.body.patient;
        let doctorName = req.body.doctor;

     let patient = await Patient.findOne({name: patientName});
     if(!_.isNil(patient)){
     let doctor = await Doctor.findOne({name: doctorName});
    if(!_.isNil(doctor)){
        patient.doctorName = doctor.userName;
        res.send("done");
      }
    } 
  } });
  
app.post("/admin/changeUserPassword",isAdminLoggedIn,(req,res)=>{
});

    app.post("/admin/login",
  passport.authenticate('admin-local', { failureRedirect: '/admin/homePage' }),
  function(req, res) {
    res.redirect('/patientHome');
    return;
  });

  */


  app.get('*', userRedirect ,function(req, res) {
    res.render("enterPage");
  });


  let port = process.env.PORT || 3000;

  let server = http.listen(port, () => {
    console.log('server is running on port', port);
  });
