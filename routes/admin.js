var express = require('express');
var router = express.Router();

let session = require('express-session');
let conn = require('../my_modules/connection');
let save_file_on_server = require('../my_modules/uploadFile')

// Manage Orders
router.post('/manage-orders', function (req, res) {
    console.log(req.body);

    if (session.adminID === undefined) {
        res.send('notLogged');
    } else {

        let action = req.body.action;

        let response = '';
        let Query = '';

        if (action === 'ship') {
            let {company, trackingID, trackingURL, action, orderid} = req.body;

            response = 'shipped';
            Query = "UPDATE `bill` SET status='Shipped',`trackingid`='" + trackingID + "',`companyname`='" + company + "',`trackingurl`='" + trackingURL + "' WHERE id='" + orderid + "'";
        } else {
            let {customerName, action, orderid} = req.body;

            response = 'delivered';
            Query = "UPDATE `bill` SET status='Delivered',`personreceived`='" + customerName + "' WHERE id='" + orderid + "'";
        }

        conn.query(Query, err => {
            if (err) throw err;

            res.send(response);
        });
    }
});

router.post('/order-details', function (req, res) {
    // console.log(req.body.orderid);

    let orderid = req.body.orderid;

    let selectSQL = "SELECT bill_detail.*,product.productname,product.photo FROM `bill_detail` INNER JOIN product ON bill_detail.productid=product.productid WHERE billid='" + orderid + "'";
    conn.query(selectSQL, (err, rows) => {
        if (err) throw err;

        // console.log(rows);
        res.send(rows);
    });
});

router.post('/get-orders', function (req, res) {
    // console.log(req.body.action);

    let action = req.body.action;

    let selectSQL = '';

    if (action === 'newOrders') {
        selectSQL = "SELECT * FROM `bill` WHERE status='Placed' ORDER BY `bill`.`id` DESC";
    } else if (action === 'shippedOrders') {
        selectSQL = "SELECT * FROM `bill` WHERE status='Shipped' ORDER BY `bill`.`id` DESC";
    } else if (action === 'cancelledOrders') {
        selectSQL = "SELECT * FROM `bill` WHERE status='Cancelled' ORDER BY `bill`.`id` DESC";
    } else {
        selectSQL = "SELECT * FROM `bill` WHERE status='Delivered' ORDER BY `bill`.`id` DESC";
    }

    conn.query(selectSQL, (err, rows) => {
        if (err) throw err;

        // console.log(rows);
        res.send(rows);
    });
});

// PHOTO UPLOAD
router.post('/photo', function (req, res) {
    let file = req.files.photo;
    let serverPath = `public/images/${file.name}`;
    // let dbPath = `products/${file.name}`;

    save_file_on_server(file, serverPath)

    res.send('success');
});

// Manage Product
router.post('/manage-product', function (req, res) {
    let action = req.body.action;

    if (action === "subcategory") {
        let id = req.body.id;

        let select = "SELECT subcategoryid,subcategoryname FROM `subcategory` WHERE categoryid='" + id + "'";
        conn.query(select, (err, rows) => {
            if (err) throw err;

            res.send(rows);
        });
    } else if (action === "add") {
        let {subcategory, product, price, discount, description} = req.body;
        // console.log(subcategory);
        // console.log(product);
        // console.log(price);
        // console.log(discount);
        // console.log(description);

        let file = req.files.photo;
        let serverPath = `public/products/${file.name}`;
        let dbPath = `products/${file.name}`;

        save_file_on_server(file, serverPath)

        let insertSql = "INSERT INTO `product`( `productname`, `price`, `discount`, `photo`, `pdescription`, `subcategoryid`) " +
            "VALUES ('" + product + "','" + price + "','" + discount + "','" + dbPath + "','" + description + "','" + subcategory + "')";
        conn.query(insertSql, (err) => {
            if (err) throw err;

            res.send("added");
        });
    } else if (action === "edit") {
        let {subcategory, id, product, price, discount, description} = req.body;
        // console.log(subcategory, id, product, price, discount, description);

        let updateSQL = "";

        if (req.files === null) {
            updateSQL = "UPDATE `product` SET `productname`='" + product + "',`price`='" + price + "',`discount`='" + discount + "',`pdescription`='" + description + "',`subcategoryid`='" + subcategory + "' WHERE `productid`='" + id + "'";
        } else {
            let file = req.files.photo;

            let serverPath = `public/products/${file.name}`;
            let dbPath = `products/${file.name}`;
            save_file_on_server(file, serverPath);

            updateSQL = "UPDATE `product` SET `productname`='" + product + "',`price`='" + price + "',`discount`='" + discount + "',`photo`='" + dbPath + "',`pdescription`='" + description + "',`subcategoryid`='" + subcategory + "' WHERE `productid`='" + id + "'";
        }

        conn.query(updateSQL, (err) => {
            if (err) throw err;

            res.send("updated");
        });
    } else if (action === "delete") {
        let id = req.body.id;

        let deleteSQL = "DELETE FROM `product` WHERE productid='" + id + "'";
        conn.query(deleteSQL, (err) => {
            // if (err) throw err;

            if (err) {
                if (err.errno === 1451) {
                    res.send("foreign");
                }
            } else {
                res.send("deleted");
            }
        });
    } else {
        let select = "SELECT product.*,subcategory.categoryid FROM `product` INNER JOIN subcategory ON product.subcategoryid=subcategory.subcategoryid ORDER BY `productid`  DESC;";
        // let select = "SELECT * FROM `product` ORDER BY `productid`  DESC";
        conn.query(select, (err, rows) => {
            if (err) throw err;

            res.send(rows);
        });
    }
});

// Manage Sub-Category
router.post('/manage-sub-category', function (req, res) {
    let action = req.body.action;

    if (action === "add") {
        let {category, subcategory, description} = req.body;
        // console.log(category, subcategory, description);

        let insertSql = "INSERT INTO `subcategory`(`subcategoryname`, `sdescription`, `categoryid`) VALUES ('" + subcategory + "','" + description + "','" + category + "')";
        conn.query(insertSql, (err) => {
            if (err) throw err;

            res.send("added");
        });
    } else if (action === "edit") {
        let {id, category, subcategory, description} = req.body;
        // console.log(id, category, subcategory, description);

        let updateSQL = "UPDATE `subcategory` SET `subcategoryname`='" + subcategory + "',`sdescription`='" + description + "',`categoryid`='" + category + "' WHERE `subcategoryid`='" + id + "'";
        conn.query(updateSQL, (err) => {
            if (err) throw err;

            res.send("updated");
        });
    } else if (action === "delete") {
        let id = req.body.id;

        let deleteSQL = "DELETE FROM `subcategory` WHERE subcategoryid='" + id + "'";
        conn.query(deleteSQL, (err) => {
            // if (err) throw err;

            if (err) {
                if (err.errno === 1451) {
                    res.send("foreign");
                }
            } else {
                res.send("deleted");
            }
        });
    } else {
        let select = "SELECT `subcategory`.*,category.categoryname FROM `subcategory` INNER JOIN category ON subcategory.categoryid=category.categoryid ORDER BY `subcategory`.`subcategoryid` DESC";
        conn.query(select, (err, rows) => {
            if (err) throw err;

            res.send(rows);
        });
    }
});

// Manage Category
router.post('/manage-category', function (req, res) {
    let action = req.body.action;
    // console.log(req.body);

    if (action === "add") {
        let {category, description} = req.body;

        // (`categoryid`, `categoryname`, `description`)
        let insert = "INSERT INTO `category` (`categoryname`, `description`) VALUES ('" + category + "','" + description + "')";
        conn.query(insert, (err) => {
            if (err) throw err;

            res.send("added");
        });
    } else if (action === "edit") {
        let {id, category, description} = req.body;
        // console.log(id, category, description);

        let updateSQL = "UPDATE `category` SET `categoryname`='" + category + "',`description`='" + description + "' WHERE `categoryid`='" + id + "'";
        conn.query(updateSQL, (err) => {
            if (err) throw err;

            res.send("updated");
        });
    } else if (action === "delete") {
        let id = req.body.id;

        let deleteSQL = "DELETE FROM `category` WHERE categoryid='" + id + "'";
        conn.query(deleteSQL, (err) => {
            // if (err) throw err;

            if (err) {
                // console.log(err);
                // console.log(err.errno);

                if (err.errno === 1451) {
                    res.send("foreign");
                }
            } else {
                res.send("deleted");
            }
        });
    } else {
        let select = "SELECT * FROM `category` ORDER BY `categoryid` DESC";
        conn.query(select, (err, rows) => {
            if (err) throw err;

            res.send(rows);
        });
    }
});

router.post('/change-password', function (req, res) {
    let username = session.adminID;
    // console.log(username);

    if (session.adminID === undefined) {
        res.send("login");
    } else {
        let {oldpassword, newpassword, confirmpassword} = req.body;

        let select = "SELECT * FROM `admin` WHERE username='" + username + "' AND password='" + oldpassword + "'";
        conn.query(select, (err, rows) => {
            if (err) throw err;

            if (rows.length > 0) {
                if (newpassword !== confirmpassword) {
                    res.send("notsame");
                } else {
                    let update = "UPDATE `admin` SET `password`='" + newpassword + "' WHERE username='" + username + "'";
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
    session.adminID = undefined;
    res.send('loggedOut');
});

router.get('/check-login', function (req, res) {
    if (session.adminID !== undefined) {
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
