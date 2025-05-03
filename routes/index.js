let express = require('express');
let router = express.Router();

let session = require('express-session');

let conn = require('../my_modules/connection');

let todayFun = () => {
    let date = new Date();
    // console.log(date);

    let month;
    if ((date.getMonth() + 1) < 10) {
        month = "0" + (date.getMonth() + 1);
    }

    // let today = `${date.getFullYear()}-${month}-${date.getDate()}`;
    // console.log(today);

    return `${date.getFullYear()}-${month}-${date.getDate()}`;
}

// Get Products
getRows = (id) => {
    return new Promise((resolve, reject) => {
        let Query = "SELECT * FROM `product` WHERE productid='" + id + "'";
        conn.query(Query, (err, rows) => {
            if (err) {
                return reject(err);
            }

            return resolve(rows);
        });
    });
}

router.post('/place-order', async function (req, res) {
    // console.log(req.body);

    let total = req.body.total;
    // console.log(total);

    let ids = req.body.ids;
    // console.log(ids);

    let product_ID = Object.keys(ids);

    let date = todayFun();
    // console.log(date);

    let pay_method = "Online";
    let city = "Amritsar";
    let zipcode = "143001";
    let address = "Mall Road, Asr";
    let remarks = "Handle with care"; // from Front-End
    let status = "Pending";
    let username = "user"; // from Session
    let refid = null; // from Razorpay

    let paymentstatus = "";

    if (pay_method === "COD") {
        paymentstatus = "Pending";
    } else {
        paymentstatus = "Paid";
    }

    // var all_rows = [];

    let bill_SQL = "INSERT INTO bill(grandtotal, `date`, paymentmethod, city, zipcode, address, status, username, paymentstatus) " +
        "VALUES ('" + total + "', '" + date + "', '" + pay_method + "', '" + city + "', '" + zipcode + "', '" + address + "'," +
        " '" + status + "', '" + username + "', '" + paymentstatus + "')";
    // console.log(bill_SQL);
    conn.query(bill_SQL, async (err, rows) => {
        if (err) throw err;

        let last_bill_id = rows.insertId;

        for (let id of product_ID) {
            // for (let id of ids) {
            try {
                const one_row = await getRows(id);

                let {productid, productname, price, discount, photo, pdescription, subcategoryid} = one_row[0];

                let quantity = ids[id];

                let net_price = Math.round(price - ((price * discount) / 100));

                let details_sql = "INSERT INTO `bill_detail`(`price`, `discount`, `netprice`, `quantity`, `productid`, `billid`) " +
                    "VALUES ('" + price + "','" + discount + "','" + net_price + "','" + quantity + "','" + productid + "','" + last_bill_id + "')";
                // console.log(details_sql);
                conn.query(details_sql, async (err) => {
                    if (err) throw err;

                }); // Insert Into BILL_DETAILS Table
            } catch (e) {
                console.log(e);
                res.sendStatus(500);
            }
        }

        // res.send(all_rows.flat());
        res.send("order_placed");
    }); // Insert Into BILL Table
});

router.post('/book-order', (req, res) => {
    // console.log(req.body);

    if (session.userID === undefined) {
        res.send('login');
    } else {
        // let total = session.grand_total;

        let {city, zipcode, address, remarks, pay_id, payment, grandTotal} = req.body;

        let date = todayFun();
        let orderStatus = "Placed";

        let paymentStatus = "";

        if (payment === "COD") {
            paymentStatus = "Pending";
        } else {
            paymentStatus = "Paid";
        }

        let username = session.userID; // from Session

        let bill_SQL = "INSERT INTO bill(grandtotal, paymentmethod, city, zipcode, address, status, username, paymentstatus) " +
            "VALUES ('" + grandTotal + "', '" + payment + "', '" + city + "', '" + zipcode + "', '" + address + "'," +
            " '" + orderStatus + "', '" + username + "', '" + paymentStatus + "')";
        // console.log(bill_SQL);
        conn.query(bill_SQL, async (err, rows) => {
            if (err) throw err;

            let last_bill_id = rows.insertId;

            session.cart.forEach(item => {
                let {
                    productid,
                    productname,
                    price,
                    net_price,
                    discount,
                    photo,
                    pdescription,
                    subcategoryid,
                    quantity
                } = item;

                let details_sql = "INSERT INTO `bill_detail`(`price`, `discount`, `netprice`, `quantity`, `productid`, `billid`) " +
                    "VALUES ('" + price + "','" + discount + "','" + net_price + "','" + quantity + "','" + productid + "','" + last_bill_id + "')";
                // console.log(details_sql);
                conn.query(details_sql, async (err) => {
                    if (err) throw err;

                }); // Insert Into BILL_DETAILS Table
            })

            session.cart = undefined;
            // console.log(session.cart);

            res.send("placed");
        }); // Insert Into BILL Table
    }
});

// Calculate GrandTotal
let Calculate_GrandTotal = (cart) => {
    let grand_total = 0;

    for (let item of cart) {
        grand_total += item.net_price * item.quantity;
    }

    return grand_total;
}

// Add To Cart
router.post('/add-to-cart', (req, res) => {
    // console.log(req.body);

    var cart = [];

    if (session.cart !== undefined) {
        cart = session.cart;
    }

    let action = req.body.action;

    // ADD TO CART
    if (action === 'add') {
        // console.log(req.body.data);

        let {productid, productname, price, discount, photo, pdescription, subcategoryid} = req.body.data;

        let net_price = Math.round(price - ((price * discount) / 100));

        let temp_cart = {
            productid,
            productname,
            price,
            net_price,
            discount,
            photo,
            pdescription,
            subcategoryid,
        }

        // check product exist in Cart or Not.
        let isExist = false;

        for (let item of cart) {
            if (item.productid === productid) {
                // console.log(item.productid, productid);
                isExist = true;
                break;
            }
        }

        if (isExist === false) {
            temp_cart.quantity = 1;
            cart.push(temp_cart);
            session.cart = cart;
            res.send({count: cart.length});
        } else {
            res.send({status: "duplicate"});
        }
        // console.log(isExist);
    }
    // CART COUNT
    else if (action === 'cartCount') {
        if (session.cart !== undefined) {
            res.send({count: session.cart.length});
        } else {
            res.send({count: 0});
        }
    }
    // VIEW
    else if (action === 'view') {

        if (session.cart !== undefined) {
            let amount = Calculate_GrandTotal(cart);
            // console.log(amount);

            session.grand_total = amount;

            res.send({'cart': session.cart, 'grand_total': amount});
        } else {
            res.send({'cart': [], 'grand_total': 0});
        }
    }
    // DELETE
    else if (action === 'delete') {
        let {pid} = req.body;

        let temp_cart = [];

        temp_cart = cart.filter(item => item.productid !== pid);

        let grand_total = 0;

        for (let item of temp_cart) {
            grand_total += item.net_price * item.quantity;
        }
        // console.log(grand_total);

        cart.push(temp_cart);

        session.cart = temp_cart;
        session.grand_total = grand_total;

        res.send({count: temp_cart.length, grand_total});
    }
    // BUTTON (+, -)
    else if (action === 'inc' || action === 'less') {
        let {pid} = req.body;

        // console.log(cart);

        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productid === pid) {
                // console.log('Product Matched');

                if (action === 'inc') {
                    cart[i].quantity += 1;
                } else {
                    cart[i].quantity -= 1;
                }
            }
        }

        session.cart = cart;

        let amount = Calculate_GrandTotal(cart);
        // console.log(amount);

        session.grand_total = amount;

        res.send({cart: session.cart, grand_total: amount});
        // res.send('success');
    }

    // console.log('Cart --- ', cart);
    // console.log('Total Items --- ', cart.length);
    // console.log('Grand Total --- ', session.grand_total);
})

/* products in cart */
router.post('/cart-products', async function (req, res) {
    // console.log(req.body);

    let ids = JSON.parse(req.body.ids);
    // console.log(ids);

    var all_rows = [];

    for (let id of ids) {
        try {
            const one_row = await getRows(id);
            // console.log(one_row);

            all_rows = [...all_rows, one_row];
            // all_rows.push(one_row);
        } catch (e) {
            console.log(e);
            res.sendStatus(500);
        }
    }

    res.send(all_rows.flat());
    // res.status(200).json({rows: all_rows.flat()});
});


/* SEARCH */
router.post('/search', function (req, res) {
    let searched_Product = req.body.searchText;
    console.log(searched_Product);

    // let sql = "SELECT * FROM `product` WHERE productname LIKE '%" + searched_Product + "'";
    // let sql = "SELECT * FROM `product` WHERE productname LIKE '" + searched_Product + "%'";
    let sql = "SELECT * FROM `product` WHERE productname LIKE '%" + searched_Product + "%'";
    console.log(sql);
    conn.query(sql, (err, rows) => {
        if (err) throw err;

        res.send(rows);
    });
});

/* products related to sub-category */
router.post('/sub-products', function (req, res) {
    // console.log(req.body);
    let id = req.body.id;

    let sql = "SELECT * FROM `product` WHERE subcategoryid='" + id + "'";
    conn.query(sql, (err, rows) => {
        if (err) throw err;

        res.send(rows);
    });
});

/* sub category */
router.post('/get-sub-category', function (req, res) {
    // console.log(req.body);
    let id = req.body.id;

    let sql = "SELECT * FROM `subcategory` WHERE categoryid='" + id + "'";
    conn.query(sql, (err, rows) => {
        if (err) throw err;

        res.send(rows);
    });
});

/* category */
router.get('/get-category', function (req, res) {
    let sql = "SELECT * FROM `category` ORDER BY `category`.`categoryname` ASC";
    conn.query(sql, (err, rows) => {
        if (err) throw err;

        res.send(rows);
    });
});

/* VIEW PRODUCTS */
router.post('/view-products', function (req, res) {
    // console.log(req.body);

    let action = req.body.action;
    let sql = "";

    if (action === "home") {
        sql = "SELECT product.*,subcategory.subcategoryname FROM product INNER JOIN subcategory ON product.subcategoryid=subcategory.subcategoryid ORDER BY product.productname ASC LIMIT 5";
    } else if (action === "single_product") {
        let id = req.body.id;

        sql = "SELECT * FROM `product` WHERE productid='" + id + "'";
    } else {
        sql = "SELECT product.*,subcategory.subcategoryname FROM product INNER JOIN subcategory ON product.subcategoryid=subcategory.subcategoryid ORDER BY `product`.`productname` ASC";
    }

    conn.query(sql, (err, rows) => {
        if (err) throw err;

        // console.log(rows);

        res.send(rows);
    });
});

/* VIEW */
// router.get('/view-products', function (req, res) {
//     let sql = "SELECT * FROM `product` ORDER BY `product`.`productname` ASC";
//     conn.query(sql, (err, rows) => {
//         if (err) throw err;
//
//         res.send(rows);
//     });
// });

// User Login
router.post('/admin-login', function (req, res, next) {
    let {username, password} = req.body;

    let select = "SELECT * FROM `admin` WHERE username='" + username + "' AND password='" + password + "'";
    conn.query(select, (err, row) => {
        if (err) throw err;

        if (row.length > 0) {
            session.adminID = username;
            // console.log(session.adminID);

            res.send('success');
        } else {
            res.send('failed');
        }
    });
});

// User Login
router.post('/user-login', function (req, res) {
    let {username, password} = req.body;

    let select = "SELECT * FROM `users` WHERE username='" + username + "' AND password='" + password + "'";
    conn.query(select, (err, row) => {
        if (err) throw err;

        if (row.length > 0) {
            session.userID = username;
            // console.log(session.userID);

            res.send('success');
        } else {
            res.send('failed');
        }
    });
});

// User Login
router.post('/user-signup', function (req, res) {
    // console.log(req.body);

    let {username, email, password, confirmpassword, name, mobile, address} = req.body;

    let select = "SELECT * FROM `users` WHERE username='" + username + "'";
    // console.log(select);
    conn.query(select, (err, row) => {
        if (err) throw err;

        // console.log(row.length);

        if (row.length > 0) {
            res.send('exist');
        } else {
            if (password !== confirmpassword) {
                res.send('notmatched');
            } else {
                // (`username`, `email`, `password`, `fullname`, `address`, `mobileno`)
                let insert = "INSERT INTO `users` VALUES ('" + username + "','" + email + "','" + password + "','" + name + "','" + address + "','" + mobile + "')";
                conn.query(insert, (err) => {
                    if (err) throw err;

                    res.send('success');
                });
            }
        }
    });
});


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

module.exports = router;
