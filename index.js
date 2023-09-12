const { default: makeConn, DisconnectReason, BufferJSON, useMultiFileAuthState, MessageType, MessageOptions, Mimetype } = require('@whiskeysockets/baileys');
var { Boom } = require('@hapi/boom');
const fs = require('fs');
const sequelize = require('./config/database');
const User = require('./models/user');
const converter = require('json-2-csv');



// sequelize.sync({ force: true }).then(() => console.log('db is ready'));
sequelize.sync().then(() => console.log('db is ready'));

var sockClient = "";
var entryCode = "";
var entryCount = 0;
var defaultSocket;


async function updateEntryCode(phone = "") {

  if (!phone) {
    var randNo = Math.floor(100000 + Math.random() * 900000);
    entryCode = randNo + "";
    entryCount = await User.count();

    defaultSocket.broadcast.emit('entry', { code: entryCode, count: entryCount, phone: phone });
    defaultSocket.emit('entry', { code: entryCode, count: entryCount, phone: phone });

  } else {
    const user = await User.findOne({ where: { phone: phone } });

    if (!user) {
      await User.create({ phone: phone });
      var randNo = Math.floor(100000 + Math.random() * 900000);
      entryCode = randNo + "";
      entryCount = await User.count();
      defaultSocket.broadcast.emit('entry', { code: entryCode, count: entryCount, phone: phone });
      defaultSocket.emit('entry', { code: entryCode, count: entryCount, phone: phone });
      sockClient.sendMessage(getJid(phone), { text: "Entry Done ✅" });

    } else {
      sockClient.sendMessage(getJid(phone), { text: "Entry Already Done ❌" });
    }

  }


}


async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_mlsc');

  console.log(makeConn);

  sockClient = makeConn({
    printQRInTerminal: true,
    auth: state
  });

  sockClient.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
      // reconnect if not logged out
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('opened connection');
      console.log('Logged in to');

    }
  })

  sockClient.ev.on('creds.update', saveCreds);

  sockClient.ev.on('messages.upsert', async m => {
    console.log(JSON.stringify(m, undefined, 2));
    
    var message = "";

    // if ("conversation" in m?.messages[0].message) {
    // message = m?.messages[0].message?.conversation;
    // } else {
    //   message = m?.messages[0].message?.extendedTextMessage.text;
    // }


    try{
      message = m?.messages[0].message?.extendedTextMessage.text ;
    }catch(err){
      try{
        message = m?.messages[0].message?.conversation;
      }catch(er){
        console.log(er);
      }
    }
    
    var phone;

    try {
      var phone = getPhoneFromJid(m.messages[0].key.remoteJid);
    } catch (err) {
      console.log(err);
      phone = "";
    }


  var isPhoneExists =   await fetch("https://pwsheets.vercel.app/api/getDirectRange?range=A1:I4000&sheetId=1o6zmnshWMuv6e8DocjzYMSHD5uv9qWHt9SFsjs6tFgQ")
  .then(res => res.json())
  .then(async json => {
      json = [...json,
        {"Timestamp":"10/11/2023 14:58:34","Name":"Mankirat Singh","Email id":"satviktola@gmail.com","Phone no. ":"9888034284","Roll number / Application number":"135587","Branch":"COBS","Gender":"Male","Hostel":"K"},
        {"Timestamp":"10/11/2023 14:58:34","Name":"Dev Singh","Email id":"dev@gmail.com","Phone no. ":"9413737698","Roll number / Application number":"135587","Branch":"COBS","Gender":"Male","Hostel":"K"}
      ];

      no_in_json = json.find(x => x['Phone no. '] == phone || x['Phone no. '].replace("+91","") == phone );
      console.log(no_in_json);

      const csv = await converter.json2csv(no_in_json);
      console.log(csv);
      return no_in_json;
    }).catch(err => console.log(err));


    if (phone) {
      var phone_m;
      try{
        phone_m = isPhoneExists['Phone no. '];
      }catch(ex){
        phone_m = "";
      }

      if(phone == phone_m){
        if (message == entryCode) {
        console.log("CODE FOUND");
        updateEntryCode(phone);
        var csv = await converter.json2csv(isPhoneExists);
        await saveCsv(csv);
      }
    }else{
      if (message == entryCode) {
      sockClient.sendMessage(getJid(phone), { text: "Not Registered 🫠" });
      }
    }
  }

    console.log("message is:" + message + ",SENT BY:" + m.messages[0].key.remoteJid);
    // console.log('Logged in to', m.messages[0].key.remoteJid);
  })
}



connectToWhatsApp();




function getJid(phone) {
  phone += "";
  var length = [...phone].length;;
  if (length == 10) {
    phone = "91" + phone;
  }

  if (!phone.includes('@s.whatsapp.net')) {
    phone = `${phone}@s.whatsapp.net`;
  }

  return phone;
}


function getPhoneFromJid(jid) {
  jid += "";
  var length = [...jid].length;;
  if (length != 10) {
    jid = jid.slice(2);
  }

  if (jid.includes('@s.whatsapp.net')) {
    jid = jid.replace('@s.whatsapp.net', "");
  }

  return jid;
}


const express = require('express');
const app = express();
var cors = require('cors');
const { saveCsv } = require('./csv');
app.use(cors());
app.use(express.json());

app.set('view engine', 'ejs');

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const port = process.env.PORT || 8080;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// app.use(express.urlencoded());


app.get('/', function(req, res, next) {
  res.render('home');
});

app.get('/backup', function(req, res) {
  res.sendFile(path.join(__dirname, 'dev.sqlite'));
});


io.on('connection', (socket) => {
  socket.emit('replyFromSocket', { message: 'Server Connected Successfully' });


  console.log('a user connected');
  defaultSocket = socket;

  updateEntryCode();

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
})

server.listen(port, function() {
  console.log('CORS-enabled web server listening on port ' + port)
})
