require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 3000;

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@ton-domaine.com";

if (!SENDGRID_API_KEY) {
  console.error("ERREUR : SENDGRID_API_KEY n'est pas défini dans le fichier .env ou sur Render");
  process.exit(1);
}
sgMail.setApiKey(SENDGRID_API_KEY);

app.use(cors({
  origin: process.env.FRONTEND_URL || "*" // Mettre l'URL de ton frontend Netlify ici
}));
app.use(express.json());

app.post('/add-task', async (req, res) => {
  try {
    const { email, taskName, reminderTime } = req.body;

    if (!email || !taskName || !reminderTime) {
      return res.status(400).send("Tous les champs sont obligatoires.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).send("Adresse email invalide.");

    const reminderDate = new Date(reminderTime);
    if (isNaN(reminderDate.getTime())) return res.status(400).send("Format de date invalide.");

    const delay = reminderDate.getTime() - Date.now();
    if (delay <= 0) return res.status(400).send("La date de rappel doit être dans le futur.");

    sendConfirmationEmail(email, taskName)
      .then(() => console.log(`Email de confirmation envoyé à ${email}`))
      .catch(err => console.error("Erreur email confirmation :", err));

    setTimeout(() => {
      sendReminderEmail(email, taskName)
        .then(() => console.log(`Rappel envoyé à ${email}`))
        .catch(err => console.error("Erreur email rappel :", err));
    }, delay);

    res.status(200).send("Tâche ajoutée avec succès !");
  } catch (err) {
    console.error("Erreur route /add-task :", err);
    res.status(500).send("Erreur serveur.");
  }
});

async function sendConfirmationEmail(to, taskName) {
  const msg = {
    to,
    from: EMAIL_FROM,
    subject: "✅ Tâche ajoutée avec succès",
    text: `Bonjour,\n\nVotre tâche "${taskName}" a été ajoutée avec succès.\n\nVous recevrez un rappel à l'heure prévue.\n\nBonne journée !`,
  };
  await sgMail.send(msg);
}

async function sendReminderEmail(to, taskName) {
  const msg = {
    to,
    from: EMAIL_FROM,
    subject: "🕒 Rappel de votre tâche",
    text: `Bonjour,\n\nVoici votre rappel pour la tâche : "${taskName}".\n\nBon courage et bonne journée !`,
  };
  await sgMail.send(msg);
}

app.listen(PORT, () => {
  console.log(`✅ Serveur backend en ligne sur le port ${PORT}`);
});