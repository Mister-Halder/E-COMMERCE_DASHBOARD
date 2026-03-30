const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require('./db/config');
const User = require("./db/User");
const Product = require("./db/Product");
const Jwt = require('jsonwebtoken');
const jwtKey = 'e-comm';
const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // Only allow requests from the frontend app
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

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
        
        let imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        
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
        let user = new User(req.body);
        let result = await user.save();
        result = result.toObject();
        delete result.password;
        Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
            if (err) {
                resp.send({ result: "Something went wrong, Please try after sometime" })
            }
            resp.send({ user: result, auth: token })
        })
    } catch (error) {
        resp.status(500).send({ message: "Registration failed", error });
    }
});

app.post("/login", async (req, resp)=>{
    console.log(req.body)
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "Something went wrong, Please try after sometime" })
                }
                resp.send({ user, auth: token })
            })
        } else {
            resp.send({ result: 'No User Found' })
        }
    } else {
        resp.send({ result: 'No User Found' })
    }
})

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

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});