let _ = require('lodash');
const nodemailer = require("nodemailer");

const sendEmail = async (receiver,subject,emailBody) => {
    
let testAccount = await nodemailer.createTestAccount();

let transporter = nodemailer.createTransport( {
    service: 'Gmail',
    auth: {
        user: 'shahi.tushar8@gmail.com',
        pass: 'kaleidosco'
    }
});

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'shahi.tushar8@gmail.com', // sender address
    to: receiver, // list of receivers
    subject: subject, // Subject line
    text: emailBody, // plain text body
    html : "<html>Emergency</html>"
});

}


const sendEmergencyEmails = async (doctors, patientName) => {


    for(let i = 0 ; i < doctors.length; i++)
    {
        if(!_.isNil(doctors[i].email)){
        try{
       await  sendEmail(doctors[i].email,patientName + " is having an emergency", "Patient has emergency");
                    
        }
        catch(e){
            console.log(e);
        }
            
    }

    }
}

module.exports = {
    sendEmail : sendEmail,
    sendEmergencyEmails : sendEmergencyEmails
}