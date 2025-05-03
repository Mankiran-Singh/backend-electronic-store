const mysql = require('mysql');

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Mani@123',
    database: 'react_electronic_store'
});

conn.connect(function (err) {
    if (err) throw err;

    console.log("Connection Created :)");
});

module.exports = conn;
