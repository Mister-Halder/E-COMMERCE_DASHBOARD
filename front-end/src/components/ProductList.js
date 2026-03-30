import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ProductList = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        getProducts();
    }, []);

    const getProducts = async () => {
        let result = await fetch('http://localhost:5000/products', {
            headers: {
                authorization: `bearer ${JSON.parse(localStorage.getItem('token'))}`
            }
        });
        result = await result.json();
        if (Array.isArray(result)) {
            setProducts(result);
        } else {
            setProducts([]);
        }
    }

    const deleteProduct = async (id) => {
        let result = await fetch(`http://localhost:5000/product/${id}`, {
            method: "Delete",
            headers: {
                authorization: `bearer ${JSON.parse(localStorage.getItem('token'))}`
            }
        });
        result = await result.json();
        if (result) {
            getProducts(); // Refetch after successful deletion
        }
    }

    const searchHandle = async (event) => {
        let key = event.target.value;
        if (key) {
            let result = await fetch(`http://localhost:5000/search/${key}`, {
                headers: {
                    authorization: `bearer ${JSON.parse(localStorage.getItem('token'))}`
                }
            });
            result = await result.json();
            if (result) {
                setProducts(result);
            }
        } else {
            getProducts(); // Restores original list if search is empty
        }
    }

    return (
        <div className="product-list-container">
            <h1>Products Dashboard</h1>
            <input 
                type="text" 
                className="inputBox search-product-box" 
                placeholder="Search products by Name, Company, or Category..." 
                onChange={searchHandle}
                style={{ width: '100%', maxWidth: '600px', margin: '0 auto 30px', display: 'block' }}
            />
            
            <div className="product-grid">
                {
                    products.length > 0 ? products.map((item, index) =>
                        <div key={item._id} className="product-card" style={{animationDelay: `${index * 0.05}s`}}>
                            <div className="product-badge">{item.category}</div>
                            <h3 className="product-name">{item.name}</h3>
                            <div className="product-price">${item.price}</div>
                            <div className="product-company">by <span>{item.company}</span></div>
                            <div className="product-actions">
                                <button onClick={() => deleteProduct(item._id)} className="action-btn delete-btn">Delete</button>
                                <Link to={`/update/${item._id}`} className="action-btn edit-btn" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Edit</Link>
                            </div>
                        </div>
                    )
                    : <div className="no-products">
                        <h2>No Products Found</h2>
                        <p>Get started by adding some products to your inventory.</p>
                      </div>
                }
            </div>
        </div>
    )
}

export default ProductList;
