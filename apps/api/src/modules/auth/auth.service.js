const ldap = require("ldapjs");

// Dev mode test credentials (only when DEV_MODE=true)
const DEV_CREDENTIALS = {
  admin: "password",
  testuser: "password"
};

function authenticateWithAD(username, password) {
  return new Promise((resolve, reject) => {
    if (!username || !password) {
      reject("Username and password are required");
      return;
    }

    // Dev mode: allow test credentials without LDAP
    if (process.env.DEV_MODE === "true") {
      if (DEV_CREDENTIALS[username] && DEV_CREDENTIALS[username] === password) {
        console.log(`[DEV MODE] Authenticated user: ${username}`);
        return resolve({ username });
      }
      return reject("Invalid dev credentials");
    }

    const client = ldap.createClient({
      url: process.env.AD_URL
    });

    const userDN = `${username}@${process.env.AD_DOMAIN}`;

    client.bind(userDN, password, (err) => {
      if (err) {
        client.unbind();
        return reject("Invalid credentials");
      }

      client.unbind();
      resolve({ username });
    });
  });
}

module.exports = { authenticateWithAD };