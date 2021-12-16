const express = require("express");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const { text } = require("body-parser");
const path = require("path");
const e = require("express");

//Setup DB connection
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/electronicstore" /*path of DB*/, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Get Express Session
const session = require("express-session");

const Order = mongoose.model("Order", {
  name: String,
  memberNumber: String,
  quantityDoorBellInput: Number,
  quantityOutdoorCamerasInput: Number,
  quantityBabyMonitorsInput: Number,
  subTotal: Number,
  tax: Number,
  total: Number,
});

//Setup model for the collection - admin
const Admin = mongoose.model("Admin", {
  username: String,
  password: String,
});

var myApp = express();
myApp.use(express.urlencoded({ extended: true }));
myApp.use(bodyParser.urlencoded({ extended: true }));

//Setup Session
myApp.use(
  session({
    secret: "superrandomsecret",
    resave: false,
    saveUninitialized: true,
  })
);
myApp.use(express.static(__dirname + "/public"));
myApp.set("views", path.join(__dirname, "views"));
myApp.set("view engine", "ejs");

//home page get method
myApp.get("/", function (req, res) {
  res.render("form");
});

//get login page
myApp.get("/login", function (req, res) {
  res.render("login");
});

//post login page
myApp.post("/login", function (req, res) {
  var user = req.body.username;
  var pass = req.body.password;
  //user, pass values we are getting from the form and we will validate these with the values stored in DB.
  console.log(user);
  console.log(pass);
  //Note: key should match with the key in database
  Admin.findOne({ username: user, password: pass }).exec(function (err, admin) {
    //log any errors
    console.log(`Errors : ${err}`);
    console.log(`Admin : ${admin}`);

    if (admin) {
      //if admin object is created it will return true
      //store username in session and set logged in true
      req.session.username = admin.username;
      req.session.userLoggedIn = true;

      //redirect user to the dashboard- allorders page
      res.redirect("/allorders");
    } else {
      //display error if user info is incorrect
      res.render("login", { error: "Sorry Login Failed" });
    }
  });
});

//home page post method
myApp.post(
  "/",
  [
    check("name", "Name is required!").notEmpty(),
    check("memberNumber", "membership number is required!").notEmpty(),
  ],
  function (req, res) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render("form", { errors: errors.array() });
    } else {
      const priceDoorBell = 49.98 * req.body.quantityDoorBellInput;
      const priceOutdoorCameras = 149.49 * req.body.quantityOutdoorCamerasInput;
      const priceBabyMonitors = 99.99 * req.body.quantityBabyMonitorsInput;
      const subTotal = priceDoorBell + priceOutdoorCameras + priceBabyMonitors;
      const tax = 0.13 * subTotal;

      var data = {
        name: req.body.name,
        memberNumber: req.body.memberNumber,
        priceDoorBell: priceDoorBell,
        priceOutdoorCameras: priceOutdoorCameras,
        priceBabyMonitors: priceBabyMonitors,
        subTotal: subTotal,
        tax: tax,
        total: subTotal + tax,
        quantityDoorBellInput: req.body.quantityDoorBellInput,
        quantityOutdoorCamerasInput: req.body.quantityOutdoorCamerasInput,
        quantityBabyMonitorsInput: req.body.quantityBabyMonitorsInput,
      };
      var myOrder = new Order(data);
      myOrder.save().then(function () {
        console.log("New Order Created!");
      });
      res.render("form", data);
    }
  }
);

//get all orders page
myApp.get("/allorders", function (req, res) {
  if (req.session.userLoggedIn) {
    Order.find({}).exec(function (err, orders) {
      console.log(err);
      res.render("allorders", { orders: orders });
    });
  } else {
    res.redirect("/login");
  }
});

//get delete page
myApp.get("/delete/:id", function (req, res) {
  if (req.session.username) {
    var objid = req.params.id;
    Order.findByIdAndDelete({ _id: objid }).exec(function (err, order) {
      console.log("Narinder");
      console.log("Error:" + err);
      console.log("Order:" + order);
      if (order) {
        res.render("delete", { message: "Successfully Deleted..!!" });
      } else {
        res.render("delete", { message: "Sorry, record not Deleted..!!" });
      }
    });
  } else {
    res.redirect("/login");
  }
});

//logout page
myApp.get("/logout", function (req, res) {
  req.session.username = "";
  req.session.userLoggedIn = false;
  res.render("login", { error: "successfully logged out!" });
});

myApp.listen(8080);
console.log("Server running");
