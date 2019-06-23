
let mongoose = require('mongoose');

 const Patient = mongoose.model('Patient', {
  userName: String,
  fullName: String,
  password: String,
  doctorId: String,
  age: Number,
  gender: String
}, "Patients");


 const Doctor = mongoose.model('Doctor', {
  userName: String,
  fullName: String,
  password: String,
  age: Number,
  department: String,
  email : String
}, "Doctors");

 const Admin = mongoose.model('Admin', {
  password: String,
  userName: String
},"Admins");

module.exports = {

    Patient : Patient,
    Admin : Admin,
    Doctor : Doctor

}