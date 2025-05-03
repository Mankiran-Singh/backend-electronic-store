const dotenv=require('dotenv');

dotenv.config({path:'./config.env'});
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);  
const mysql = require('mysql2');

const connectionConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'react_electronic_store',
    port: process.env.MYSQL_PORT || 3306,
};

const conn = mysql.createConnection(connectionConfig);

conn.connect(function (err) {
    if (err) throw err;
    console.log("Connection Created :)");
});

module.exports = conn;
