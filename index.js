let express = require('express');
let app = express();
let http = require('http').Server(app);
let mongoose = require('mongoose');
let passport = require('passport');
let LocalStrategy = require('passport-local').Strategy;
let bodyParser = require('body-parser');
let session = require('express-session');
let cookieParser = require('cookie-parser');
let flash = require('connect-flash');
let _ = require('lodash');


app.use(cookieParser('secret'));

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))


app.use(session({ secret: 'tusharshahi' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


app.use(function (req, res, next) {
  res.locals.success_messages = req.flash('success');
  res.locals.error_messages = req.flash('failure');
  next();
});


app.set('view engine', 'pug')


const dbUrl = 'mongodb://tusharshahi:password8@ds155294.mlab.com:55294/patientchatapp'
mongoose.connect(dbUrl, (err) => {

  console.log('mongodb connected', err);
})

let Patient = mongoose.model('Patient', {
  userName: String,
  fullName: String,
  password: String,
  patientId: String,
  doctorName: String,
  age: Number,
  gender: String
}, "Patients");


let Doctor = mongoose.model('Doctor', {
  userName: String,
  fullName: String,
  password: String,
  doctorId: String,
  age: Number,
  department: String
}, "Doctors");

const Admin = mongoose.model('Admin', {

  password: String,
  userName: String
});



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
    Admins.findOne({ userName: userName }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Admin does not exist' }); }
      if (user && user.password == password) { return done(null, false, { message: 'Password is incorrect' }); }
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



const isAdmin = (user) => {
  if (!_.isNil(user.adminId)) {
    return true;
  }
}

const userRedirect = function (req, res, next) {
  if (!_.isNil(req.user)) {
    if (!_.isNil(req.user.department)) {
      res.render("doctorHome", { doctorData: req.user });
      return;
    }
    else {
      res.render("patientHome", { patientData: req.user });
      return;
    }
  }
  else {
    let errorMessage = req.flash('error');
    if (!_.isNil(errorMessage))
      res.render("enterPage", { message: errorMessage });
    else
      res.render("enterPage");

    return;
  }
};

const checkIfDoctorExists = async function (req, res, next) {
  let doctor = await Doctor.findOne({ userName: req.body.userName });
  if (!_.isNil(doctor)) {
    req.flash('failure', 'This user name already exists');
    res.redirect("/enterPage");
  }
  // res.render('enterPage', {error : 'User name already exists'}); }
  else next();
}

const checkIfPatientExists = async function (req, res, next) {
  let patient = await Patient.findOne({ userName: req.body.userName });
  if (!_.isNil(patient)) {
    req.flash('failure', 'This user name already exists');
    res.redirect("/enterPage");
  }
  else
    next();
}


const isAdminLoggedIn = async function (req, res, next) {
  if (!_.isNil(req.user)) {
    let user = req.user;
    if (isAdmin(user)) {
      next();
    }
    else {
      res.render("adminEnterPage.pug");
    }
  }
  else {
    res.render("adminEnterPage.pug");

  }
}




app.get("/patientRegisterErr", (req, res) => {
  res.redirect("/enterPage")
});
app.get("/doctorRegisterErr", (req, res) => {
  res.redirect("/enterPage")
});


app.post("/patientLogin",
  passport.authenticate('patient-local', { failureRedirect: '/enterPage', failureFlash: true }),
  function (req, res) {
    res.render('patientHome', { patientData: req.user });
  });


app.post("/doctorLogin",
  passport.authenticate('doctor-local', { failureRedirect: '/enterPage', failureFlash: true }),
  function (req, res) {
    res.render('doctorHome', { doctorData: req.user });
  });



app.post("/patientRegister", checkIfPatientExists, function (req, res) {
  let data = {
    userName: req.body.userName,
    fullName: req.body.fullName,
    password: req.body.password,
    age: req.body.age,
    gender: req.body.gender
  };
  Patient.create(data, function (err) {
    if (err) {
      return handleError(err);
    }
    else {
      console.log("saved patient");
      res.render("patientHome", { patientData: data });
    }
  })
});

app.post("/doctorRegister", checkIfDoctorExists, function (req, res) {
  let data = {
    userName: req.body.userName,
    fullName: req.body.fullName,
    password: req.body.password,
    age: req.body.age,
    department: req.body.department
  };
  Doctor.create(data, function (err) {
    if (err) {
      return handleError(err);
    }
    else {
      console.log("saved doctor");
      res.render("doctorHome", { doctorData: data });
    }
  })
});




app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});


//Admin routes


app.post("/adminLogin",
  passport.authenticate('admin-local', { failureRedirect: '/admin/homePage' }),
  function (req, res) {
    res.render('adminHomePage', { admin: req.user });
  });

app.get("/admin/homePage",
  isAdminLoggedIn, (req, res) => {
    res.render("adminHomePage", { admin: req.user });
  });

app.get("/admin/settings",
  isAdminLoggedIn, (req, res) => {
    let doctors = Doctor.find();
    let patients = Patient.find();
    res.render("adminSettings", { admin: req.user, patients: patients, doctors: doctors });
  });

app.post("/admin/assignDoctor", isAdminLoggedIn, async (req, res) => {
  if (!_.isNil(req.body.patient) && !_.isNil(req.body.doctor)) {
    let patientName = req.body.patient;
    let doctorName = req.body.doctor;

    let patient = await Patient.findOne({ name: patientName });
    if (!_.isNil(patient)) {
      let doctor = await Doctor.findOne({ name: doctorName });
      if (!_.isNil(doctor)) {
        patient.doctorName = doctor.userName;
        res.send("done");
      }
    }
  }
});

app.post("/admin/changeUserPassword", isAdminLoggedIn, (req, res) => {
});






app.get('*', userRedirect, function (req, res) {
  let errorMessage = req.flash('error');
  res.render("enterPage");
});







let port = process.env.PORT || 3000;

let server = http.listen(port, () => {
  console.log('server is running on port', port);
});

const io = require('socket.io')(server);


io.on('connection', (socket) => {
  console.log("connection done");
  console.log(socket.handshake.query.userType + ' ' + socket.handshake.query.userName + 'has joined');


  socket.on('sendMessage', (text) => {
    console.log("received text" + text);
  });



});


