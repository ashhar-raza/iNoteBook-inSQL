const mysql2 = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();
const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    queueLimit: 1000,
});

const db = (...args) => {
    return new Promise((resolve, reject) => {
        pool.query(...args, (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                resolve(result);
            }

        })
    })
}



process.on("SIGINT", () => {
    pool.end((err) => {
        if (err) {
            console.error("Error closing MySQL pool:", err);
        } else {
            console.log("MySQL pool closed gracefully.");
        }
        process.exit(err ? 1 : 0);
    });
});
module.exports = db;