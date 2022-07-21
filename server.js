require('dotenv').config();

const { Sequelize } = require('sequelize');

const express = require('express');
app = express();
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios').default;
const cors = require('cors');

//for DB
const sequelize = new Sequelize('postgres', 'postgres', 'grisha2014', {
  host: 'localhost',
  dialect:'postgres',
  port: "5432",
  define: {
      timestamps: false
    }
});

let users;
const User = sequelize.define("user", {
id: {
  type: Sequelize.INTEGER,
  autoIncrement: true,
  primaryKey: true,
  allowNull: false
},
username: {
  type: Sequelize.STRING,
  allowNull: false
},
password: {
  type: Sequelize.STRING,
  allowNull: false
}
});

function updateUsers(){
User.findAll({raw:true}).then((getusers)=>{
  users = getusers;
  console.log(users);
}).catch(err=>console.log('err inn find all'));
}

User.drop().then((res) => {console.log(res);} );
//for DB

app.use(
  cors({
    origin:["http://localhost:3000"],
    methods:["GET","POST"],
    credentials:true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
//переменые для хранение хэдэров карэнтюзера и токона
let refreshTokens = [];
//переменые для хранение хэдэров карэнтюзера и токона
let  loginuser;

//create

app.post('/create',(req,res)=>{
const { username, password } = req.body;
// conect and add to DB
sequelize.sync({force:false}).then(result=>{
  console.log('result');
  User.create({
    username: username,
    password: password
  })
  .then(()=>{ console.log('done creating')})
  .then(()=>{updateUsers()})
  .catch(err=>console.log('err in'));
})
.catch(err=> console.log('err out'));
// conect and add to DB

res.json({mass:"new user logged",status:true});
});
//create

//обработка аксестокена
app.post('/posts',authenticateToken,(req,res)=>{
res.json({success: true});
});
//обработка аксестокена

//создание токенов 
app.post('/login',(req,res)=>{
const { username, password } = req.body;
if(username==='' || password===''){res.json({mass:'Username or password incorrect',status:false});}
loginuser = users.find(u => { return u.username === username && u.password === password });

 if (loginuser) {
    const accessToken = generateAccessToken(loginuser);
    const refreshToken = jwt.sign({ username: loginuser.username }, process.env.REFRESH_TOKEN_SECRET);
    refreshTokens.push(refreshToken);

   res.json({accessToken:accessToken,refreshToken:refreshToken,status:true});   
} else {
    res.json({mass:'Username or password incorrect',status:false});
}
});
//создание токенов 

app.post('/token',(req,res)=>{
  const refreshToken = req.body.token;
  if (refreshToken == null || undefined)return res.sendStatus(401);
  if (!refreshTokens.includes(refreshToken))return res.sendStatus(403);

jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET,(err)=>{
    if(err)return res.sendStatus(403);
    const accessToken = generateAccessToken(loginuser);
   
    res.json({accessToken:accessToken});
        })
 });

function authenticateToken(req,res,next){ 
const authHeader = req.headers.authorization;
const token = authHeader && authHeader.split(' ')[1];

if(token===undefined){
    return res.sendStatus(401);
}

jwt.verify(token,process.env.ACCSESS_TOKEN_SECRET,(err)=>{
    if(err)return res.sendStatus(403)
    req.user=loginuser;
    next();
})
}

function generateAccessToken(user){
return jwt.sign({ username: user.username}, process.env.ACCSESS_TOKEN_SECRET,{expiresIn:'15s'});
}

app.listen(3001);