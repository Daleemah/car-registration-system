const axios = require('axios');

async function getToken() {
  try {
    const response = await axios.post(
      'https://nibssbyphoenix.onrender.com/api/auth/token',
      {
        email: "you@email.com",
        password: "yourPassword"
      }
    );

    console.log("TOKEN:", response.data.token);

  } catch (err) {
    console.log("ERROR:");
    console.log(err.response?.data || err.message);
  }
}

getToken();
