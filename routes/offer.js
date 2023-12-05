const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");

router.post(
  "/offer/publish",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      const pictureToUpload = req.files.picture;
      // On envoie une à Cloudinary un buffer converti en base64
      const result = await cloudinary.uploader.upload(
        convertToBase64(pictureToUpload)
      );
      //return res.json(result);
      console.log(result);

      const newOffer = new Offer({
        product_name: req.body.title,
        product_description: req.body.description,
        product_price: req.body.price,
        product_condition: req.body.condition,
        product_details: [
          { MARQUE: req.body.brand },
          { TAILLE: req.body.size },
          { ÉTAT: req.body.condition },
          { COULEUR: req.body.color },
          { EMPLACEMENT: req.body.city },
        ],
        product_image: result,
        owner: req.user,
      });
      console.log(newOffer);
      await newOffer.save();
      return res.json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;

    const filter = {};
    // trier par titre de produit
    if (title) {
      filter.product_name = new RegExp(title, "i");
    }
    // trier par prix minimum
    if (priceMin) {
      filter.product_price = {
        $gte: priceMin,
      };
    }

    // trier par prix maximum
    if (priceMax) {
      if (filter.product_price) {
        filter.product_price.$lte = priceMax;
      } else {
        filter.product_price = {
          $lte: priceMax,
        };
      }
    }

    const sortFilter = {};
    // trier par ordre décroissant
    if (sort === "price-desc") {
      sortFilter.product_price = "desc";
      // trier par ordre croissant
    } else if (sort === "price-asc") {
      sortFilter.product_price = "asc";
    }

    // sélectionner le nombre d'article par page -- 5
    let pageToSend = 1;
    if (page) {
      pageToSend = page;
    }
    const skip = (pageToSend - 1) * 5;

    const offers = await Offer.find(filter)
      .populate("owner")
      .sort(sortFilter)
      .limit(5)
      .skip(skip);
    // .select("product_price product_name");

    res.status(201).json({ offers: offers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MODIFY AN OFFER
router.put(
  "/offer/update/:id",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      // On va chercher l'offre correspondant à l'id
      const ModifyOffer = await Offer.findById(req.params.id);
      // si on reçoit un title dans le body
      if (req.body.title) {
        // on remplace le product_name
        ModifyOffer.product_name = req.body.title;
      }
      if (req.body.description) {
        ModifyOffer.product_description = req.body.description;
      }
      if (req.body.price) {
        ModifyOffer.product_price = req.body.price;
      }
      if (req.body.condition) {
        ModifyOffer.product_condition = req.body.product_condition;
      }

      const details = ModifyOffer.product_details;

      // On parcourt le tableau product_details de l'offre à modifier
      for (let i = 0; i < details.length; i++) {
        console.log(details[i]);
        // Pour chaque objet, si on a reçu un détail à modifier on met à jour la clé de l'objet
        if (details[i].MARQUE) {
          if (req.body.brand) {
            details[i].MARQUE = req.body.brand;
          }
        }
        if (details[i].TAILLE) {
          if (req.body.size) {
            details[i].TAILLE = req.body.size;
          }
        }
        if (details[i].ÉTAT) {
          if (req.body.condition) {
            details[i].ÉTAT = req.body.condition;
          }
        }
        if (details[i].COULEUR) {
          if (req.body.color) {
            details[i].COULEUR = req.body.color;
          }
        }
        if (details[i].EMPLACEMENT) {
          if (req.body.location) {
            details[i].EMPLACEMENT = req.body.location;
          }
        }
      }

      await ModifyOffer.save();
      res.status(201).json(ModifyOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// DELETE AN OFFER
router.delete("/offer/:id", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    // si l'id a bien été transmis
    if (req.params.id) {
      // On recherche l'offre à supprimer à partir de son id et on la supprime :
      await Offer.findByIdAndDelete(req.params.id);

      // on répond au client
      res.status(200).json({ message: "Offer deleted" });
    } else {
      // si aucun id n'a été transmis :
      res.status(400).json({ messsage: "Missing id" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offerbyId = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offerbyId);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Export du router qui contient mes routes
module.exports = router;
