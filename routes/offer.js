const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post(
  "/offers/publish",
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
      .sort(sortFilter)
      .limit(5)
      .skip(skip)
      .select("product_price product_name");

    res.status(201).json(offers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/offer/update", async (req, res) => {
  try {
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/offers/:id", async (req, res) => {
  try {
    // si l'id a bien été transmis
    if (req.params.id) {
      // On recherche l'offre à modifier à partir de son id et on la supprime :
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

router.get("/offers/:id", async (req, res) => {
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
