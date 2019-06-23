let models =  require("./models");
let passport = require("passport");
let express = require('express');
let app = express();
let http = require('http').Server(app);
let mongoose = require('mongoose');

let crypto = require('crypto');

const request = require('request');

let bodyParser = require('body-parser');
let session = require('express-session');
let cookieParser = require('cookie-parser');
let flash = require('connect-flash');
let _ = require('lodash');

let freeMailer = require('./mailer');
const Patient = models.Patient;
const Doctor = models.Doctor;
const Admin = models.Admin;


var pushpad = require('pushpad');

var project = new pushpad.Pushpad({
  authToken: '8668db9c3ef88d455d80c1e1ffec8f4d',
  projectId: 6809
});


app.use(cookieParser('secret'));

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))


app.use(session({ secret: 'tusharshahi' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
require('./passportConfig');

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


let doctorsAvailable = [];
let doctorsBeingWaitedFor = [];

const isAdmin = (user) => {
  if (!_.isNil(user.adminId)) {
    return true;
  }
}

const userRedirect = function (req, res, next) {
  if (!_.isNil(req.user)) {
    if (!_.isNil(req.user.department)) {
      res.render("doctorHome", { doctorData: req.user , id : req.user.id , doctorHash : req.user.pushPadHash});
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
  let doctor = await Doctor.findOne({ userName: req.body.username });
  if (!_.isNil(doctor)) {
    req.flash('failure', 'This user name already exists');
    res.redirect("/enterPage");
  }
  // res.render('enterPage', {error : 'User name already exists'}); }
  else next();
}

const checkIfPatientExists = async function (req, res, next) {
  let patient = await Patient.findOne({ userName: req.body.username });
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
    res.render('doctorHome', { doctorData: req.user , id : req.user.id , doctorHash : req.user.pushPadHash});
  });



app.post("/patientRegister", checkIfPatientExists, async function (req, res) {
  let data = {
    userName: req.body.username,
    fullName: req.body.fullName,
    password: req.body.password,
    age: req.body.age,
    gender: req.body.gender
  };
  let savePatient = new Patient(data);
  let newPatient = await savePatient.save();
  if(!_.isNil(newPatient)){
      console.log("saved patient");
      res.render("patientHome", { patientData: data , id : data.id});
    }
});

app.post("/doctorRegister", checkIfDoctorExists,async function (req, res) {
  
 let doctorHash =  crypto.createHmac('sha1', '8668db9c3ef88d455d80c1e1ffec8f4d').update(req.body.userName);
  
  let data = {
    userName: req.body.username,
    fullName: req.body.fullName,
    password: req.body.password,
    age: req.body.age,
    department: req.body.department,
    email : req.body.email,
    pushPadHash : doctorHash
  };
  let saveDoctor = new Doctor(data);
  let newDoctor = await saveDoctor.save();
  if(!_.isNil(newDoctor)){
      console.log("saved doctor");
      res.render("doctorHome", { doctorData: data , id : data.id , doctorHash : pushPadHash});
    }
});






//Admin routes


app.post("/admin/login",
  passport.authenticate('admin-local', { failureRedirect: '/admin/login' }),
  async  function (req, res) {
    let doctors = await Doctor.find();
    let patients =await  Patient.find();
    
    res.render('adminHome', { admin: req.user, patients : patients, doctors : doctors });
  });

app.get("/admin/homePage",
  isAdminLoggedIn, async (req, res) => {
    let doctors = await Doctor.find();
    let patients = await Patient.find();
    res.render("adminHome", { admin: req.user, patients : patients, doctors : doctors });
  });

app.get("/admin/settings",
  isAdminLoggedIn, async  (req, res) => {
    let doctors =await  Doctor.find();
    let patients = await Patient.find();
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

app.post("/admin/exchangeDoctor",isAdminLoggedIn,async(req,res)=> {

  if (!_.isNil(req.body.patientOne) && !_.isNil(req.body.patientTwo)) {
    let patientOneName = req.body.patientOne;
    let patientTwoName = req.body.patientTwo;

    let patientOne = await Patient.findOne({ name: patientOneName });
    if (!_.isNil(patient)) {
      let doctor = await Patient.findOne({ name: patientTwoName });
      if (!_.isNil(doctor)) {
        let temporaryDoctorName = patientOne.doctorName
        patientOne.doctorName = patientTwo.doctorName; 
        patientTwo.doctorName =  temporaryDoctorName;
        
        doctorsAvailable = doctorsAvailable.filter(function( obj ) {
          return (obj !== patientOne.doctorName)&&(obj !== patientOne.doctorName) ;
      });
      
      doctorsBeingWaitedFor = doctorsBeingWaitedFor.filter(function( obj ) {
        return (obj.doctor !== patientOne.doctorName) && (obj.doctor !== patientOne.doctorName);
    });

        res.send("done");

      }
    }
  }

  
});
//app.post("/admin/changeUserPassword", isAdminLoggedIn, (req, res) => {
//});



app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});



app.get("/admin/*",isAdminLoggedIn, async  function(req,res){
  let errorMessage = req.flash('error');
 
  let doctors = Doctor.find();
  let patients = Patient.find();  
  res.render("adminHome",{admin : admin, patients : patients , doctors : doctors});
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
  console.log(socket.id + " has joined");
  console.log(socket.handshake.query.userType + ' ' + socket.handshake.query.userName + 'has joined');
  if(socket.handshake.query.userType == 'patient')
  {
    
    let doctorId =  socket.handshake.query.doctorId;
    
    if(!_.isNil(doctorId)){

      let doctorAvailable = false;
      for(let i = 0 ; i < doctorsAvailable.length;i++){
        if(doctorsAvailable[i] == doctorId){
          socket.emit("doctorAvailable");
          let socketsList = io.sockets.sockets
          for(let i=0;i< socketsList.length;i++){
            if(socketsList[i].doctorId == doctorId){
              let doctorSocketId = socketsList[i].id;
              socket.partner = doctorSocketId;
              io.to(doctorSocketId).emit("partnerAvailable",socket.id);
              break;
            }

          }

          doctorAvailable = true;
          break;
        }
      }
      
      if(!doctorAvailable){
        doctorsBeingWaitedFor.push({doctor : doctorId, patient : socket.id });
      }

    }
    
    socket.on('emergency',async (data)=>{
      console.log("userName is  " + data.userName);
      //socket.broadcast.emit('patientEmergency',{'patientName' : data.userName});
      let doctors = await Doctor.find({});
      freeMailer.sendEmergencyEmails(doctors,data.userName);
      let doctorIds = doctors.map((x) => x['userName']);
      let validIds = doctorIds.filter((x) => !_.isNil(x));
      let notification = {
        "notification": {
          "body": "Hello world",
          "title": "My Website",
          "target_url": "https://cryptic-ocean-55969.herokuapp.com/enterPage",
          "ttl": 600,
          "urgent": true,
          "starred": false,
        },
        "uids": validIds,
      }
      let postAPI = 'https://pushpad.xyz/api/v1/projects/' + 6809 + '/notifications'
      let response = await request.post(postAPI,{
        json : notification
      });
      console.log(response);
        });
  

    socket.on('logout',()=>{
      doctorsBeingWaitedFor = doctorsBeingWaitedFor.filter(function( obj ) {
        return obj.patient !== socket.id;
    });
    });
  
  } 
  else if(socket.handshake.query.userType == 'doctor'){
    let userId = socket.handshake.query.userId;
 
    socket.doctorId = userId;
    doctorsAvailable.push(socket.doctorId);
    
    for(let  i = 0 ; i < doctorsBeingWaitedFor.length; i++){
      if(doctorsBeingWaitedFor[i].doctor == socket.doctorId){
        io.to(doctorsBeingWaitedFor[i].patient).emit("doctorAvailable");
        io.to(doctorsBeingWaitedFor[i].patient).emit("partnerAvailable",socket.id);        
        socket.partner = doctorsBeingWaitedFor[i].patient;      
      }
    }

    socket.on('logout',()=>{
      doctorsAvailable = doctorsAvailable.filter(function( obj ) {
        return obj !== socket.doctorId;
    });});
   }

   socket.on('addPartner',(partnerId)=>{
    socket.partner = partnerId;   
   });
  socket.on('sendMessage', (text) => {
    io.to(socket.partner).emit("message",text.text);
  });

});
