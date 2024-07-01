const express = require('express');
const path = require('path');
const Nano = require('nano');
const multer = require('multer');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const session = require('express-session'); // 세션 추가
const sdk = require('./sdk');
const fs = require('fs');
const { Gateway, Wallets } = require('fabric-network');

const app = express();
const upload = multer({ dest: 'uploads/' });

const nano = Nano({
  url: 'http://admin:adminpw@localhost:5984',
  parseUrl: false
});

const userDbName = 'channel1_abstore';
const musicDbName = 'music_database';
const userDb = nano.db.use(userDbName);
const musicDb = nano.db.use(musicDbName);

// 세션 설정
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // HTTPS를 사용하는 경우 true로 설정
}));

async function createDBs() {
  try {
    await nano.db.create(userDbName);
    console.log(`Database '${userDbName}' created successfully.`);
  } catch (error) {
    if (error.statusCode === 412) {
      console.log(`Database '${userDbName}' already exists.`);
    } else {
      console.error('Error creating user database:', error);
    }
  }

  try {
    await nano.db.create(musicDbName);
    console.log(`Database '${musicDbName}' created successfully.`);
  } catch (error) {
    if (error.statusCode === 412) {
      console.log(`Database '${musicDbName}' already exists.`);
    } else {
      console.error('Error creating music database:', error);
    }
  }
}

async function createDesignDoc() {
  const designDoc = {
    _id: '_design/song_views',
    views: {
      by_songName: {
        map: function (doc) {
          if (doc.type === 'song' && doc.songName) {
            emit(doc.songName, doc);
          }
        }.toString()
      },
      by_user: {
        map: function (doc) {
          if (doc.type === 'song' && doc.userID) {
            emit(doc.userID, doc);
          }
        }.toString()
      }
    }
  };

  try {
    await musicDb.insert(designDoc);
    console.log('Design document created successfully in music database.');
  } catch (error) {
    if (error.statusCode === 409) {
      console.log('Design document already exists in music database.');
    } else {
      console.error('Error creating design document in music database:', error);
    }
  }
}

function generateUniqueId(prefix) {
  return `${prefix}:${crypto.randomBytes(16).toString('hex')}`;
}

const PORT = 8001;
const HOST = '0.0.0.0';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

async function send(isQuery, fcn, args, res, callback) {
  try {
    const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('abstore');

    let result;
    if (isQuery) {
      result = await contract.evaluateTransaction(fcn, ...args);
    } else {
      result = await contract.submitTransaction(fcn, ...args);
    }

    console.log(`Transaction has been ${isQuery ? 'evaluated' : 'submitted'}`);
    if (callback) {
      callback({ status: 'SUCCESS', result: result.toString() });
    } else {
      res.status(200).json({ result: result.toString() });
    }
    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    if (callback) {
      callback({ status: 'ERROR', message: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
}

app.post('/register', async function (req, res) {
  let name = req.body.name;
  let id = req.body.id;
  let pw = req.body.pw;
  let phone_number = req.body.phone_number;
  let account_number = req.body.account_number;
  let account_money = req.body.account_money;

  const user = {
    _id: id,
    type: 'user',
    name,
    pw,
    phone_number,
    account_number,
    account_money,
    point: 1000
  };

  try {
    await userDb.insert(user);
    console.log('User registered successfully');
    res.status(200).json({ message: '회원가입이 성공적으로 완료되었습니다.', success: true });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.', details: error.message });
  }
});

app.post('/login', async function (req, res) {
  let userId = req.body.userId;
  let userPw = req.body.userPw;

  console.log(`Login attempt for user ID: ${userId} with password: ${userPw}`);

  try {
    if (!userId || !userPw) {
      throw new Error('Invalid parameters');
    }

    const user = await userDb.get(userId);
    if (user && user.pw === userPw) {
      req.session.userId = userId; // 세션에 사용자 ID 저장
      console.log('Login successful');
      res.status(200).json({ success: true, user });
    } else {
      console.log('Login failed: Incorrect password');
      res.status(401).json({ success: false, message: '로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ success: false, message: '로그인 중 오류가 발생했습니다.', details: error.message });
  }
});

app.get('/deleteUser', function (req, res) {
  let name = req.query.name;
  let args = [name];
  sdk.send(false, 'delete', args, res);
});

app.post('/transfer', async function (req, res) {
  const { songName } = req.body;
  const buyerId = req.session.userId; // 세션에서 현재 로그인된 사용자 ID 가져오기

  if (!buyerId) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  try {
    const body = await musicDb.view('song_views', 'by_songName', { key: songName });

    if (body.rows.length === 0) {
      return res.status(404).json({ error: '해당 음원이 존재하지 않습니다.' });
    }

    const song = body.rows[0].value;
    const sellerId = song.userID;

    if (sellerId === buyerId) {
      return res.status(400).json({ error: '자신의 음원을 구매할 수 없습니다.' });
    }

    const seller = await userDb.get(sellerId);
    const buyer = await userDb.get(buyerId);
    const admin = await userDb.get('Admin');

    if (!seller || !buyer) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const price = song.price;
    const transferAmount = price * 0.9;
    const adminAmount = price * 0.1;

    if (buyer.point < price) {
      return res.status(400).json({ error: '구매자의 포인트가 부족합니다.' });
    }

    buyer.point -= price;
    seller.point += transferAmount;
    admin.point += adminAmount;
    song.userID = buyerId; // 음원의 소유자를 구매자로 변경

    await userDb.insert(seller);
    await userDb.insert(buyer);
    await userDb.insert(admin);
    await musicDb.insert(song);

    res.status(200).json({ success: true, message: '음원 거래가 성공적으로 완료되었습니다.' });
  } catch (error) {
    console.error('Error during transfer:', error);
    res.status(500).json({ error: '음원 거래 중 오류가 발생했습니다.', details: error.message });
  }
});

app.get('/query', async function (req, res) {
  let userId = req.query.name;
  console.log(`Fetching data for user ID: ${userId}`);

  try {
    const user = await userDb.get(userId);
    if (user) {
      console.log(`User data: ${JSON.stringify(user)}`);
      res.status(200).json(user);
    } else {
      console.log('User not found');
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Error fetching user data', details: error.message });
  }
});

app.get('/userSongs', async function (req, res) {
  const userID = req.query.userID;

  try {
    const body = await musicDb.view('song_views', 'by_user', { key: userID });
    const songs = body.rows.map(row => row.value);
    res.status(200).json(songs);
  } catch (error) {
    console.error('Error fetching user songs:', error);
    res.status(500).json({ error: 'Error fetching user songs' });
  }
});

app.post('/registerMusic', upload.fields([{ name: 'audioFile', maxCount: 1 }, { name: 'imageFile', maxCount: 1 }]), async function (req, res) {
  try {
    if (!req.files || !req.files['audioFile'] || !req.files['imageFile']) {
      throw new Error('Files are not properly uploaded');
    }

    const userId = req.body.userID;

    const user = await userDb.get(userId);
    if (!user) {
      return res.status(400).json({ error: '회원 ID가 유효하지 않습니다.' });
    }

    const song = {
      _id: `song:${userId}:${Date.now()}`,
      type: 'song',
      songName: req.body.songName,
      genre: req.body.genre,
      songInfo: req.body.songInfo,
      lyrics: req.body.lyrics,
      price: parseInt(req.body.price, 10), // price를 정수형으로 변환하여 저장
      audioFile: path.join(__dirname, req.files['audioFile'][0].path),
      imageFile: path.join(__dirname, req.files['imageFile'][0].path),
      userID: userId
    };

    const response = await musicDb.insert(song);
    console.log('Document inserted:', response);

    res.status(200).json({ message: '음원 등록이 성공적으로 완료되었습니다.' });
  } catch (error) {
    console.error('Error inserting document:', error);
    if (error.statusCode === 404) {
      res.status(400).json({ error: '회원 ID가 유효하지 않습니다.' });
    } else {
      res.status(500).json({ error: '음원 등록 중 오류가 발생했습니다.', details: error.message });
    }
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/deleteMusic', async function (req, res) {
  try {
    const { songName } = req.query;

    const body = await musicDb.view('song_views', 'by_songName', { key: songName });
    if (body.rows.length === 0) {
      return res.status(404).json({ error: '음원이 존재하지 않습니다.' });
    }

    const doc = body.rows[0].value;
    const { _id, _rev } = doc;

    const response = await musicDb.destroy(_id, _rev);
    console.log('Document deleted:', response);

    res.status(200).json({ message: '음원 삭제가 성공적으로 완료되었습니다.' });
  } catch (error) {
    console.error('Error deleting document:', error);
    if (error.statusCode === 404) {
      res.status(404).json({ error: '음원이 존재하지 않습니다.' });
    } else {
      res.status (500).json({ error: '음원 삭제 중 오류가 발생했습니다.' });
    }
  }
});

app.get('/albums', async function (req, res) {
  try {
    const body = await musicDb.view('song_views', 'by_songName');
    const albums = body.rows.map(row => ({
      songName: row.value.songName,
      imageFile: row.value.imageFile
    }));
    res.status(200).json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Error fetching albums' });
  }
});

app.get('/charge', function (req, res) {
  let userId = req.query.userId;
  let amount = req.query.amount;
  let args = [userId, amount];
  sdk.send(false, 'charge', args, res);
});

app.get('/exchange', function (req, res) {
  let userId = req.query.userId;
  let amount = req.query.amount;
  let args = [userId, amount];
  sdk.send(false, 'exchange', args, res);
});

createDBs().then(() => {
  return createDesignDoc();
}).then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}).catch(error => {
  console.error('Error setting up databases:', error);
});
