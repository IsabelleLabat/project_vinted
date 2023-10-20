const express = require("express");
const uid2 = require("uid2"); //package qui sert à crér des string aléatoires
const SHA256 = require("crypto-js/sha256"); // sert à encrypter une string
const encBase64 = require("crypto-js/enc-base64"); // sert à tranformer l'encryptage en string

const router = express.Router();

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // si l'email existe déjà
    const emailFound = await User.findOne({ email: req.body.email });
    if (emailFound !== null) {
      return res.status(400).json({ message: "email already exists" });
    }
    // si l'username n'est pas renseigné
    if (!req.body.username) {
      return res.status(400).json({ message: "Username is required" });
    }
    // on génère un salt
    const salt = uid2(16);
    // console.log("salt =>> ", salt);
    // on génère un hash
    const hash = SHA256(salt + req.body.password).toString(encBase64);
    //console.log("hash ", hash);
    const token = uid2(64);
    // on génère un token
    // console.log("token   ", token);

    // const {username, email, password, newsletter} = req.body;
    const newUser = new User({
      unsername: req.body.username,
      email: req.body.email,
      password: req.body.password,
      newsletter: req.body.newsletter,
      account: { username: req.body.username },
      token: token,
      hash: hash,
      salt: salt,
    });
    console.log(newUser);

    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      token: token,
      account: {
        username: newUser.account.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // aller chercher le user en BDD via son mail
    const user = await User.findOne({ email: req.body.email });
    if (user === null) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const newHash = SHA256(user.salt + req.body.password).toString(encBase64);
    console.log(newHash);
    console.log(user.hash);
    if (newHash !== user.hash) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({
      _id: user._id,
      token: user.token,
      account: user.account,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Export du router qui contient mes routes
module.exports = router;
