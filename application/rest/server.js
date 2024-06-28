const express = require('express');
const app = express();
let path = require('path');
let sdk = require('./sdk');

const PORT = 8001;
const HOST = '0.0.0.0';
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/register', function (req, res) {
   let name = req.query.name;
   let id = req.query.id;
   let pw = req.query.pw;
   let phone_number = req.query.phone_number;
   let account_number = req.query.account_number;
   let account_money = req.query.account_money;
   let args = [name, id, pw, phone_number, account_number, account_money];
   sdk.send(false, 'register', args, res);
});

app.get('/login', function (req, res) {
   let userId = req.query.userId;
   let userPw = req.query.userPw;
   let args = [userId, userPw];
   sdk.send(true, 'login', args, res).catch((err) => {
    console.error('Login failed:', err.message);
    res.status(500).send('Internal Server Error');
  });
});

app.get('/delete', function (req, res) {
   let name = req.query.name;
   let args = [name];
   sdk.send(false, 'delete', args, res);
});

app.get('/invoke', function (req, res) {
   let sender = req.query.sender;
   let receiver = req.query.receiver;
   let amount = req.query.amount;
   let args = [sender, receiver, amount];
   sdk.send(false, 'invoke', args, res);
});

app.get('/query', function (req, res) {
   let name = req.query.name;
   let args = [name];
   sdk.send(true, 'query', args, res);
});

app.get('/delete', function (req, res) {
   let a = req.query.a
   let args = [a];
   sdk.send(false, 'delete', args, res);
});

app.get('/transfer', function (req, res) {
   let sender = req.query.sender;
   let receiver = req.query.receiver;
   let amount = req.query.amount;
   let args = [sender, receiver, amount];
   sdk.send(false, 'transfer', args, res);
});




app.use(express.static(path.join(__dirname, '../client')));
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
