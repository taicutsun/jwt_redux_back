require('dotenv').config();

const express = require('express');
app = express();
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios').default;
const cors = require('cors');


app.use(
  cors({
    origin:["http://localhost:3000"],
    methods:["GET","POST"],
    credentials:true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
//переменые для хранение хэдэров карэнтюзера и токона(в идиале переделать)
let user;
let refreshTokens = [];
//переменые для хранение хэдэров карэнтюзера и токона(в идиале переделать)
let users = [];

//create

app.post('/create',(req,res)=>{
const { username, password } = req.body;
users.push({username:username,password:password});console.log(users);

res.send("new user logged");
});
//create

//обработка аксестокена
app.post('/posts',authenticateToken,(req,res)=>{
//  res.json(posts.filter(post=>post.username == req.user.username));
//console.log(req.headers);
res.json({success: true});
});
//обработка аксестокена

//создание токенов 
app.post('/login',(req,res)=>{
const { username, password } = req.body;
if(username==='' || password===''){res.json({mass:'Username or password incorrect',status:false});}
user = users.find(u => { return u.username === username && u.password === password });

 if (user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign({ username: user.username }, process.env.REFRESH_TOKEN_SECRET);
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
    const accessToken = generateAccessToken(user);
    //console.log('creating new atoken');
    res.json({accessToken:accessToken});
        })
 });

function authenticateToken(req,res,next){ 
const authHeader = req.headers.authorization;//console.log(`auth=${authHeader}`);
const token = authHeader && authHeader.split(' ')[1];

if(token===undefined){
    return res.sendStatus(401);
}

jwt.verify(token,process.env.ACCSESS_TOKEN_SECRET,(err)=>{
    if(err)return res.sendStatus(403)
    req.user=user;//console.log(`user=${req.user}`);
    next();
})
}

function generateAccessToken(user){
return jwt.sign({ username: user.username}, process.env.ACCSESS_TOKEN_SECRET,{expiresIn:'15s'});
}

app.listen(3001);