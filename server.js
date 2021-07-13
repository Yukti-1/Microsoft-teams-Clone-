//backend code
/******************************************************* */
require("dotenv").config();
const mongoose = require("mongoose");
const Msg = require("./models/messages");
const mongodb = process.env.MONGODB_URI;
mongoose
  .connect(mongodb, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("connected to mongoDB");
  })
  .catch((err) => console.log(err));
/************************************************************************/
var path = require("path");
const express = require("express"); //declaring our express server
const ejs = require("ejs"); //add EJS Node module to our server
const app = express(); //running our express server
const bodyParser = require("body-parser");
const cors = require("cors");
//creating server url which is to be used to run server,actually we are creating a server to be used in socket.io
const server = require("http").Server(app);

const io = require("socket.io")(server);
// Peer
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
// uuid library to create a random unique URL for each room.
const { v4: uuidv4 } = require("uuid");

app.set("view engine", "ejs"); // set the view engine to ejs
app.set("views", "./views");
app.use(cors());
app.use(express.static("public")); //render static files
app.use("/peerjs", peerServer);
/*************************************************************************************/

const session = require("express-session");
app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);
const passport = require("passport");
var userProfile;
app.use(passport.initialize());
app.use(passport.session());
app.get("/success", (req, res) => {
  res.render("success", { user: userProfile });
});

app.get("/dashbrd", (req, res) => {
  res.render("dashboard", { user: userProfile });
});

app.get("/error", (req, res) => res.send("error logging in"));
passport.serializeUser(function (user, cb) {
  cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});
/*  Google AUTH  */
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const { use } = require("passport");
const GOOGLE_CLIENT_ID =
  "59350927246-ckbopa25jkrum2aq8tru6el202id25sp.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "VhVNbHoD1_-7FeLFir_HItHx";
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      //  callbackURL: "http://localhost:3030/auth/google/callback",
      callbackURL: "https://video-chit-chat.herokuapp.com/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      userProfile = profile;
      return done(null, userProfile);
    }
  )
);
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/error" }),
  function (req, res) {
    // Successful authentication, redirect success.
    res.redirect("/success");
  }
);
/**** GET Routes - display pages ***
/*************************************************************************************/
//login page route
app.use(express.json());
app.get("/", (req, res) => {
  res.render(path.join(__dirname, "views/home.ejs"), { url: "/home" });
});

// dashboard route
app.get("/dashboard/:email", (req, res) => {
  const { email } = req.params;
  res.render(path.join(__dirname, "views/dashboard.ejs"), { email: email });
});
app.get("/dashboard", (req, res) => {
  res.render(path.join(__dirname, "views/dashboard.ejs"));
});

/**********************************************************************************/
const users = require("./data").userDB;
app.use(express.urlencoded({ extended: false }));
const bcrypt = require("bcrypt");

app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", async (req, res) => {
  try {
    let foundUser = users.find((data) => req.body.email === data.email);
    if (!foundUser) {
      let hashPassword = await bcrypt.hash(req.body.password, 10);

      let newUser = {
        id: Date.now(),
        username: req.body.username,
        email: req.body.email,
        password: hashPassword,
      };
      users.push(newUser);
      console.log("User list", users);

      res.send(
        "<div align ='center'><h2>Registration successful</h2></div><br><br><div align='center'><a href='/'>Login</a></div><br><br><div align='center'><a href='/regiser'>Register another user</a></div>"
      );
    } else {
      res.send(
        "<div align ='center'><h2>Email already used</h2></div><br><br><div align='center'><a href='/register'>Register again</a></div>"
      );
    }
  } catch {
    res.send("Internal server error");
  }
});

/********************************************************************* */
app.post("/home", async (req, res) => {
  try {
    let foundUser = users.find((data) => req.body.email === data.email);
    if (foundUser) {
      let submittedPass = req.body.password;
      let storedPass = foundUser.password;

      const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
      if (passwordMatch) {
        res.redirect("/dashboard");
      } else {
        res.send(
          "<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='/'>login again</a></div>"
        );
      }
    } else {
      let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
      await bcrypt.compare(req.body.password, fakePass);

      res.send(
        "<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='/'>login again<a><div>"
      );
    }
  } catch {
    res.send("Internal server error");
  }
});
/**********************************************************************************/
app.get("/d", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room }); //using res.render to load up an ejs view file
});
app.get("*", (req, res) => {
  res.send("404! This is an invalid URL.");
});

/****************************************************************************************/
const activeUsers = new Set();

io.on("connection", (socket) => {
  Msg.find().then((result) => {
    socket.emit("output-messages", result);
  });
  console.log("a user connected");

  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId, userName);

    activeUsers.add(userName);
    io.to(roomId).emit("new user", [...activeUsers]);

    socket.on("disconnect", () => {
      activeUsers.delete(socket.userId);
      socket.to(roomId).emit("user-disconnected", userId, userName);
    });
    //send messages to be broadcasted to all users
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
      const messag = new Msg({ uid: roomId, msg: message, name: userName });
      messag.save().then(
        function () {
          io.to(roomId).emit("createMessage", message, userName);
        },
        function (err) {
          console.log(err.stack);
        }
      );
    });
  });
});
const port = process.env.PORT || 3030;
server.listen(port, (err) => {
  err
    ? console.log("Error in server setup")
    : console.log("Server listening on Port", port);
});
