const fs = require("fs");

const config = `window.APP_CONFIG = {
  SUPABASE_URL: "${process.env.SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}"
};`;

fs.writeFileSync("frontend/config.js", config);
console.log("Config file generated");
