const ldap = require("ldapjs");

// Dev mode test credentials (only when DEV_MODE=true)
const DEV_CREDENTIALS = {
  admin: "password",
  testuser: "password"
};

function authenticateWithAD(username, password) {
  return new Promise((resolve, reject) => {
    const normalizedUsername = String(username || "").trim();
    const normalizedPassword = String(password || "");

    if (!normalizedUsername || !normalizedPassword) {
      reject("Username and password are required");
      return;
    }

    // Dev mode: allow test credentials without LDAP
    if (process.env.DEV_MODE === "true") {
      const devKey = normalizedUsername.toLowerCase();
      if (DEV_CREDENTIALS[devKey] && DEV_CREDENTIALS[devKey] === normalizedPassword) {
        console.log(`[DEV MODE] Authenticated user: ${devKey}`);
        return resolve({ username: devKey });
      }
      return reject("Invalid dev credentials");
    }

    const client = ldap.createClient({
      url: process.env.AD_URL
    });

    const userDN = `${normalizedUsername}@${process.env.AD_DOMAIN}`;

    client.bind(userDN, normalizedPassword, (err) => {
      if (err) {
        client.unbind();
        return reject("Invalid credentials");
      }

      client.unbind();
      resolve({ username: normalizedUsername });
    });
  });
}

module.exports = { authenticateWithAD };