require("dotenv").config();

const { Sequelize } = require("sequelize");
const express = require("express");
app = express();
const jwt = require("jsonwebtoken");
const path = require("path");
const axios = require("axios").default;
const cors = require("cors");

const { authenticateToken, generateAccessToken, updateUsers } = require("./helpFunc.js");

//for DB
const sequelize = new Sequelize("postgres", "postgres", "grisha2014", {
  host: "localhost",
  dialect: "postgres",
  port: "5432",
  define: {
    timestamps: false,
  },
});

let users;
const User = sequelize.define("user", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

//connect to DB
sequelize
  .sync({ force: false })
  .then((result) => {
    console.log("result");
  })
  .catch((err) => console.log("err out"));
//conect to DB

// TODO: move it to scripts for production usage
User.drop().then((res) => {
  console.log(res);
});
//for DB

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let refreshTokens = [];
let loginuser;

//create
app.post("/create", (req, res) => {
  const { username, password } = req.body;
  //add user to DB
  User.create({
    username: username,
    password: password,
  })
    .then(() => {
      console.log("done creating");
    })
    .then(() => {
      updateUsers();
    })
    .catch((err) => console.log("err in"));

  //add user to DB

  res.json({ mass: "new user logged", status: true });
});
//create

//login and create token
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "" || password === "") {
    res.json({ mass: "Username or password incorrect", status: false });
  }
  loginuser = users.find((u) => {
    return u.username === username && u.password === password;
  });

  if (loginuser) {
    const accessToken = generateAccessToken(loginuser);
    const refreshToken = jwt.sign(
      { username: loginuser.username },
      process.env.REFRESH_TOKEN_SECRET
    );
    refreshTokens.push(refreshToken);

    res.json({
      accessToken: accessToken,
      refreshToken: refreshToken,
      status: true,
    });
  } else {
    res.json({ mass: "Username or password incorrect", status: false });
  }
});
//login and create token

//for accesstoken
app.post("/posts", authenticateToken, (req, res) => {
  res.json({ success: true });
});
//for accesstoken


app.post("/token", (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null || undefined) return res.sendStatus(400);
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err) => {
    if (err) return res.sendStatus(403);
    const accessToken = generateAccessToken(loginuser);

    res.json({ accessToken: accessToken });
  });
});

app.listen(3001);
