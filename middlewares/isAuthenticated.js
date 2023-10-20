const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // si le token est reçu
  if (req.headers.authorization) {
    // Je dois aller chercher danc la collection User, un docucment dont la clef token contient ma variable token
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    }).select("account");
    // Si je ne trouve pas l'User, je renvoie une erreur 401
    if (!user) {
      return res.status(404).json({ message: "Unauthorized" });
    } else {
      // Ici je stocke les info du user dans req dans le but d'y avoir accès dans ma route
      req.user = user;
      // Next permet de passer au middleware suivant
      return next();
    }
  }
};

module.exports = isAuthenticated;
