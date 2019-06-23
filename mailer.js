const nodemailer = require("nodemailer");

export const sendEmail = async (receiver,subject,emailBody) => {
    
let testAccount = await nodemailer.createTestAccount();

let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass // generated ethereal password
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'tushki.shahi@gmail.com', // sender address
    to: receiver, // list of receivers
    subject: subject, // Subject line
    text: emailBody // plain text body
  });

}


export const sendEmergencyEmails = async (doctorEmails, patientName) => {


    for(let i = 0 ; i < doctorEmails.length; i++)
    {
        try{
       await  sendEmail(doctorEmails[i],patientName + " is having an emergency", "Patient has emergency");
                    
        }
        catch(e){
            console.log(e);
        }

    }
}