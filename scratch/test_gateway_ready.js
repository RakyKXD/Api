const zlib = require('zlib');

const ws = new WebSocket('ws://localhost:3002/?encoding=json&v=9');

ws.onopen = () => {
  console.log('Connected to gateway');
};

ws.onmessage = async (evt) => {
  let jsonStr;
  if (typeof evt.data === 'string') {
    jsonStr = evt.data;
  } else {
    const buffer = Buffer.from(await evt.data.arrayBuffer());
    try {
      jsonStr = zlib.inflateSync(buffer).toString('utf8');
    } catch (e) {
      jsonStr = buffer.toString('utf8');
    }
  }

  const payload = JSON.parse(jsonStr);
  console.log('Received opcode:', payload.op, 't:', payload.t);

  if (payload.op === 10) { // HELLO
    console.log('Sending IDENTIFY...');
    ws.send(JSON.stringify({
      op: 2,
      d: {
        token: 'dummy',
        properties: { $os: 'windows', $browser: 'Discord Client', $device: '' },
        presence: { status: 'online', since: 0, activities: [], afk: false }
      }
    }));
  }

  if (payload.t === 'READY') {
    console.log('READY received!');
    console.log('auth object in READY:', payload.d.auth);
    console.log('user.authenticator_types:', payload.d.user.authenticator_types);
    if (Array.isArray(payload.d.auth.authenticator_types) && Array.isArray(payload.d.user.authenticator_types)) {
      console.log('SUCCESS: authenticator_types is an ARRAY in both auth and user!');
    } else {
      console.error('FAIL: authenticator_types is NOT an array!');
    }
    ws.close();
  }
};

ws.onclose = () => {
  console.log('WebSocket closed');
};
