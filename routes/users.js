var express = require('express');
var router = express.Router();

let session = require('express-session');
let conn = require('../my_modules/connection');

router.post('/cancel-order', function (req, res) {
    let id = req.body.id;

    let sql = "UPDATE `bill` SET status='Cancelled' Where id='" + id + "'";
    conn.query(sql, err => {
        if (err) throw err;

        res.send('cancelled');
    })
});

router.get('/my-orders', function (req, res) {
    let userID = session.userID;

    let selectSQL = "SELECT * FROM `bill` WHERE username='" + userID + "' ORDER BY `bill`.`id` DESC";
    conn.query(selectSQL, (err, rows) => {
        if (err) throw err;

        // console.log(rows);
        res.send(rows);
    });
});

router.post('/change-password', function (req, res) {
    if (session.userID === undefined) {
        res.send("login");
    } else {
        let username = session.userID;
        console.log(username);

        let {oldpassword, newpassword, confirmpassword} = req.body;

        let select = "SELECT * FROM `users` WHERE username='" + username + "' AND password='" + oldpassword + "'";
        conn.query(select, (err, rows) => {
            if (err) throw err;

            if (rows.length > 0) {
                if (newpassword !== confirmpassword) {
                    res.send("notsame");
                } else {
                    let update = "UPDATE `users` SET `password`='" + newpassword + "' WHERE username='" + username + "'";
                    conn.query(update, (err) => {
                        if (err) throw err;

                        res.send("success");
                    });
                }
            } else {
                res.send("invalidpassword");
            }
        });
    }
});

router.get('/logout', function (req, res) {
    session.userID = undefined;
    res.send('loggedOut');
});


router.get('/check-login', function (req, res) {
    if (session.userID !== undefined) {
        res.send('loggedIn');
    } else {
        res.send('notLogged');
    }
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

module.exports = router;
