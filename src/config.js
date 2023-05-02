const doten = require("dotenv");

doten.config();

module.exports = {
    host: process.env.HOST || "",
    database: process.env.DATABASE || "",
    user: process.env.USER || "",
    password: process.env.PASSWORD || "",
    
    passwordEmail: process.env.EMAIL_PASS || "",
    clientId: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || "",
    refreshToken: process.env.REFRESH_TOKEN || ""

};