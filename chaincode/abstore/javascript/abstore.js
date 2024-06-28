const shim = require('fabric-shim');

const ABstore = class {

  // Initialize the chaincode
  async Init(stub) {
    console.info('========= ABstore Init =========');

    // Define the Admin account details
    let adminAccount = {
      id: "Admin",
      point: 0,
      account_Number: "123-1234-5678-90", // 계좌번호는 문자열로 정의
      account_Money: 10000 // 잔액은 정수로 정의
    };

    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    try {
      // JSON 객체를 문자열로 변환하여 상태 데이터로 저장
      await stub.putState(adminAccount.id, Buffer.from(JSON.stringify(adminAccount)));
      return shim.success();
    } catch (err) {
      return shim.error(err);
    }
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    let method = this[ret.fcn];
    if (!method) {
      console.log('no method of name:' + ret.fcn + ' found');
      return shim.success();
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  
async register(stub, args) {
    if (args.length != 6) {
        return shim.error('Incorrect number of arguments. Expecting 6');
    }

    let register = {
      type : "user",
      name: args[0].trim(),
      id: args[1].trim(),
      pw: args[2].trim(),
      phone_number: args[3].trim(),
      account_number: args[4].trim(),
      account_money: parseInt(args[5].trim()),
      point: 1000 // 초기 point 값을 1000으로 설정
  };

    console.info(`Attempting to register user: ${JSON.stringify(register)}`);

    // Validate balance
    if (isNaN(register.account_money) || register.account_money < 0) {
        throw new Error('Expecting non-negative integer value for balance');
    }

    await stub.putState(register.id, Buffer.from(JSON.stringify(register)));

    console.info(`Registered user ${register.name} with ID ${register.id}`);
    console.log(register.id, register.pw);
}


async login(stub, args) {
  if (args.length != 2) {
    throw new Error('Incorrect number of arguments. Expecting 2');
  }

  let userId = args[0].trim();
  let userPw = args[1].trim();

  let userBytes = await stub.getState(userId);
  if (!userBytes || userBytes.length === 0) {
    throw new Error('User not found');
  }

  let user = JSON.parse(userBytes.toString());

  if (user.pw !== userPw) {
    throw new Error('Incorrect password');
  }

  console.info(`User ${userId} logged in successfully`);
  return Buffer.from('Login successful');
}
  

  async transfer(stub, args) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    let sender = args[0];
    let receiver = args[1];
    let amount = parseInt(args[2]);

    // 90% transfer plus
    let transferAmount = amount * 0.9;
    let fee = amount - transferAmount;

    if (isNaN(transferAmount) || transferAmount <= 0) {
      throw new Error('Expecting positive integer value for transfer amount');
    }

    let senderBalanceBytes = await stub.getState(sender);
    if (!senderBalanceBytes || senderBalanceBytes.length === 0) {
      throw new Error('Failed to get state of sender');
    }
    let senderBalance = parseInt(senderBalanceBytes.toString());

    let receiverBalanceBytes = await stub.getState(receiver);
    if (!receiverBalanceBytes || receiverBalanceBytes.length === 0) {
      throw new Error('Failed to get state of receiver');
    }
    let receiverBalance = parseInt(receiverBalanceBytes.toString());

    if (senderBalance < amount) {
      throw new Error('Sender does not have enough balance');
    }

    let AdminBalanceBytes = await stub.getState("Admin");
    if (!AdminBalanceBytes || AdminBalanceBytes.length === 0) {
      throw new Error('Failed to get state of Admin');
    }
    let AdminBalance = parseInt(AdminBalanceBytes.toString());
    if (isNaN(AdminBalance)) {
      throw new Error('Admin balance is not a valid number');
    }

    AdminBalance += fee;
    senderBalance -= amount;
    receiverBalance += transferAmount;

    await stub.putState(sender, Buffer.from(senderBalance.toString()));
    await stub.putState(receiver, Buffer.from(receiverBalance.toString()));
    await stub.putState("Admin", Buffer.from(AdminBalance.toString()));

    console.info(`Transferred ${transferAmount} (90% of ${amount}) from ${sender} to ${receiver}`);
  }

  // Deletes an entity from state
  async delete(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let A = args[0];

    // Delete the key from the state in ledger
    await stub.deleteState(A);
  }

  async query(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the person to query');
    }

    let jsonResp = {};
    let A = args[0];

    // Get the state from the ledger
    let Avalbytes = await stub.getState(A);
    if (!Avalbytes) {
      jsonResp.error = 'Failed to get state for ' + A;
      throw new Error(JSON.stringify(jsonResp));
    }

     // Parse the JSON object
     let adminAccount = JSON.parse(Avalbytes.toString());

     // Return only specific fields
     let response = {
       id: adminAccount.id,
       point: adminAccount.point,
       account_Number: adminAccount.account_Number,
       account_Money: adminAccount.account_Money
     };

    jsonResp.name = A;
    jsonResp.amount = Avalbytes.toString();
    console.info('Query Response:');
    console.info(jsonResp);
    console.info(response);
    return Avalbytes;
    // return Buffer.from(JSON.stringify(response));
  }
};

shim.start(new ABstore());
