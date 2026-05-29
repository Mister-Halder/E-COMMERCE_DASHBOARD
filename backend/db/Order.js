const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    products: [
        {
            productId: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: String, required: true },
            company: { type: String },
            category: { type: String },
            quantity: { type: Number, default: 1 }
        }
    ],
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date, default: Date.now },
    status: { type: String, default: 'Confirmed' },
    shippingAddress: { type: String, default: "" }
});

module.exports = mongoose.model("orders", orderSchema);
