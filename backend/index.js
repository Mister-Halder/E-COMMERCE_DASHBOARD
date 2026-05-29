const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require('./db/config');
const User = require("./db/User");
const Product = require("./db/Product");
const Order = require("./db/Order");
const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';
const app = express();

app.use(express.json());
app.use(cors({
    origin: "*", // Allow all origins for dev; tighten for production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Root route for connection health check
app.get("/", (req, res) => {
    res.send({ status: "Backend is running!", time: new Date().toISOString() });
});

// Logging middleware to track requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


// Serve static images
app.use('/uploads', express.static('uploads'));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // unique filename
    }
});

const upload = multer({ storage: storage });

// API to upload image and update User in DB
app.post("/upload-profile/:id", verifyToken, upload.single('profileImage'), async (req, resp) => {
    try {
        if (!req.file) {
            return resp.status(400).send({ result: "Please upload a file" });
        }
        
        // Use dynamic host for production (Render) instead of hardcoding localhost
        let imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        let result = await User.updateOne(
            { _id: req.params.id },
            { $set: { profileImage: imageUrl } }
        );

        if(result.modifiedCount > 0){
             resp.send({ result: "Image uploaded successfully", profileImage: imageUrl });
        } else {
             resp.status(404).send({ result: "User not found or nothing changed" });
        }
    } catch (error) {
        resp.status(500).send({ result: "Internal Server Error", error });
    }
});

app.get("/user/:id", verifyToken, async (req, resp) => {
    let result = await User.findOne({ _id: req.params.id }).select("-password");
    if (result) {
        resp.send(result);
    } else {
        resp.send({ result: "User not found" });
    }
});

app.put("/user/:id", verifyToken, async (req, resp) => {
    try {
        let result = await User.updateOne(
            { _id: req.params.id },
            { $set: req.body }
        );
        resp.send(result);
    } catch (error) {
        resp.status(500).send({ result: "Internal Server Error", error });
    }
});

app.post("/register", async (req, resp) => {
    try {
        if (!req.body.email || !req.body.password || !req.body.name) {
            return resp.status(400).send({ result: "Missing required fields" });
        }

        const email = req.body.email.trim().toLowerCase();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return resp.status(400).send({ result: "Email already registered" });
        }

        let user = new User({
            name: req.body.name.trim(),
            email: email,
            password: req.body.password,
            role: req.body.role || 'user'
        });

        let result = await user.save();
        result = result.toObject();
        delete result.password;

        Jwt.sign({ user: result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
            if (err) {
                return resp.status(500).send({ result: "Something went wrong, Please try after sometime" });
            }
            resp.send({ user: result, auth: token });
        });
    } catch (error) {
        resp.status(500).send({ result: "Registration failed", error });
    }
});

app.post("/login", async (req, resp)=>{
    console.log(req.body);
    if (req.body.password && req.body.email) {
        const email = req.body.email.trim().toLowerCase();
        const password = req.body.password;

        let user = await User.findOne({ email, password }).select("-password");
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    return resp.status(500).send({ result: "Something went wrong, Please try after sometime" });
                }
                resp.send({ user, auth: token });
            });
        } else {
            resp.send({ result: 'No User Found' });
        }
    } else {
        resp.send({ result: 'No User Found' });
    }
});

function verifyToken(req, resp, next) {
    let token = req.headers['authorization'];
    if (token) {
        token = token.split(' ')[1];
        Jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                resp.status(401).send({ result: "Please provide valid token" })
            } else {
                next();
            }
        })
    } else {
        resp.status(403).send({ result: "Please add token with header" })
    }
}

app.post("/add-product", verifyToken, async (req, resp)=>{
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result)
})

app.get("/products", verifyToken, async (req, resp)=>{
    let products = await Product.find();
    if(products.length>0){
        resp.send(products)
    }else{
        resp.send({result:"No Products found"})
    }
})

app.delete("/product/:id", verifyToken, async (req, resp) => {
    let result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result);
});

app.get("/product/:id", verifyToken, async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id });
    if(result) {
        resp.send(result)
    } else {
        resp.send({result: "No Record Found"})
    }
});

app.put("/product/:id", verifyToken, async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        { $set: req.body }
    );
    resp.send(result);
});

app.get("/search/:key", verifyToken, async (req, resp) => {
    // Utilize $or condition and $regex for flexible substring matching across multiple fields
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key, $options: 'i' } },
            { company: { $regex: req.params.key, $options: 'i' } },
            { category: { $regex: req.params.key, $options: 'i' } }
        ]
    });
    resp.send(result);
});

// API to place an order
app.post("/place-order", verifyToken, async (req, resp) => {
    try {
        const order = new Order(req.body);
        const result = await order.save();
        resp.send(result);
    } catch (error) {
        resp.status(500).send({ result: "Failed to place order", error });
    }
});

// API to get all orders of a user
app.get("/orders/:userId", verifyToken, async (req, resp) => {
    try {
        const result = await Order.find({ userId: req.params.userId }).sort({ orderDate: -1 });
        resp.send(result);
    } catch (error) {
        resp.status(500).send({ result: "Failed to fetch orders", error });
    }
});

// API to cancel an order by a user
app.put("/order-cancel/:id", verifyToken, async (req, resp) => {
    try {
        const result = await Order.updateOne(
            { _id: req.params.id },
            { $set: { status: 'Cancelled' } }
        );
        resp.send(result);
    } catch (error) {
        resp.status(500).send({ result: "Failed to cancel order", error });
    }
});

// Admin Stats Endpoint
app.get("/admin/stats", verifyToken, async (req, resp) => {
    try {
        const totalProducts = await Product.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        const orders = await Order.find();
        const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        const recentOrders = await Order.find().sort({ orderDate: -1 }).limit(5);

        resp.send({
            totalProducts,
            totalUsers,
            totalOrders,
            totalSales,
            recentOrders
        });
    } catch (error) {
        resp.status(500).send({ result: "Failed to fetch admin stats", error });
    }
});

// Admin Get All Orders Endpoint
app.get("/admin/orders", verifyToken, async (req, resp) => {
    try {
        const orders = await Order.find().sort({ orderDate: -1 });
        resp.send(orders);
    } catch (error) {
        resp.status(500).send({ result: "Failed to fetch all orders", error });
    }
});

// Admin Update Order Status Endpoint
app.put("/admin/order-status/:id", verifyToken, async (req, resp) => {
    try {
        const { status } = req.body;
        const result = await Order.updateOne(
            { _id: req.params.id },
            { $set: { status } }
        );
        resp.send(result);
    } catch (error) {
        resp.status(500).send({ result: "Failed to update order status", error });
    }
});

// Admin Get All Users Endpoint
app.get("/admin/users", verifyToken, async (req, resp) => {
    try {
        const users = await User.find().select("-password");
        resp.send(users);
    } catch (error) {
        resp.status(500).send({ result: "Failed to fetch users", error });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});