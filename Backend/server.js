


require('dotenv').config();


const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.use(express.static('../public'));


// la section pour la clé SendGrid

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.error("ERREUR : SENDGRID_API_KEY n'est pas défini dans le fichier .env");
  process.exit(1); 
}


const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey', 
    pass: SENDGRID_API_KEY,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error("⚠️ Erreur de connexion à SendGrid :", err);
  } else {
    console.log("✅ Transporteur SMTP SendGrid prêt à envoyer des mails.");
  }
});


app.post('/add-task', (req, res) => {
  try {
    const { email, taskName, reminderTime } = req.body;

    // Section des champs
    if (!email) {
      return res.status(400).send("L'email est obligatoire.");
    } else if (!taskName) {
      return res.status(400).send("Le nom de la tâche est obligatoire.");
    } else if (!reminderTime) {
      return res.status(400).send("L'heure du rappel est obligatoire.");
    }

    // Section pour vérification email valide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send("L'adresse e-mail est invalide.");
    }

    
    const reminderDate = new Date(reminderTime);
    if (isNaN(reminderDate.getTime())) {
      return res.status(400).send("Format de date de rappel invalide. Exemple attendu : 2025-10-15T15:30:00");
    }

    const delay = reminderDate.getTime() - Date.now();
    console.log(`Délai avant le rappel : ${delay} ms`);  
    if (delay <= 0) {
      return res.status(400).send("La date de rappel doit être dans le futur.");
    }

    // Envoie d'ajout de tâche
    sendConfirmationEmail(email, taskName)
      .then(() => console.log(` Email de confirmation envoyé à ${email}`))
      .catch(err => {
        console.error("Erreur lors de l'envoi de confirmation :", err);
        return res.status(500).send("Erreur lors de l'envoi de l'email de confirmation.");
      });

    // l'envoi du rappel
    setTimeout(() => {
      sendReminderEmail(email, taskName)
        .then(() => console.log(`📩 Email de rappel envoyé à ${email}`))
        .catch(err => {
          console.error("Erreur lors de l'envoi du rappel :", err);
        });
    }, delay);

    // Tâche ajoutée
    res.status(200).send("Tâche ajoutée et rappel planifié avec succès !");
  } catch (err) {
    console.error("Erreur dans la route /add-task :", err);
    res.status(500).send("Erreur interne du serveur.");
  }
});


async function sendConfirmationEmail(to, taskName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@ton-domaine.com",
    to,
    subject: "✅ Tâche ajoutée avec succès",
    text: `Bonjour,\n\nVotre tâche "${taskName}" a été ajoutée avec succès à votre liste.\n\nVous recevrez un rappel à l'heure prévue.\n\nBonne journée !`,
  };
  return transporter.sendMail(mailOptions);
}

// MEssage de rappel par email
async function sendReminderEmail(to, taskName) {
  console.log(`Envoi du rappel pour la tâche : "${taskName}" à ${to}`); 

  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@ton-domaine.com",
    to,
    subject: "🕒 Rappel de votre tâche",
    text: `Bonjour,\n\nVoici votre rappel pour la tâche : "${taskName}".\n\nBon courage et bonne journée !`,
  };

  return transporter.sendMail(mailOptions);
}


app.listen(PORT, (err) => {
  if (err) {
    console.error(`Erreur lors du démarrage du serveur : ${err}`);
  } else {
    console.log(`✅ Serveur backend en ligne sur http://localhost:${PORT}`);
  }
});