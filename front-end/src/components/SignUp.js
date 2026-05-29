import React, {useState, useEffect} from 'react'

import {useNavigate} from 'react-router-dom'

import API_BASE_URL from '../config';

const SignUp=()=>{
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    useEffect(()=>{
        const auth = localStorage.getItem('user');
        if(auth) {
            navigate('/')
        }
    }, [navigate])

    const collectData = async () => {
        if (!name || !email || !password) {
            setError(true);
            return false;
        }

        console.warn(name, email, password, role);
        try {
            let response = await fetch(`${API_BASE_URL}/register`, {
                method: 'post',
                body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, role }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.result || `HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server returned an invalid HTML/text page. The backend server might be offline.");
            }

            let result = await response.json();
            console.warn(result);
            if (result && result.auth) {
                localStorage.setItem("user", JSON.stringify(result.user));
                localStorage.setItem("token", JSON.stringify(result.auth));
                navigate(result.user.role === 'admin' ? '/admin' : '/');
            } else {
                alert("Please enter valid details");
            }
        } catch (err) {
            console.error("Signup Error:", err);
            alert(`Failed to connect to the server. Error: ${err.message}. Please ensure the backend is running.`);
        }
    }


    return(
        <div className="register">
            <h1>Register</h1>
            <input className="inputBox" type="text" 
            value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter Name" />
            {error && !name && <span className='invalid-input'>Enter valid name</span>}

            <input className="inputBox" type="text" 
            value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Enter Email" />
            {error && !email && <span className='invalid-input'>Enter valid email</span>}

            <input className="inputBox" type="password" 
            value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter Password" />
            {error && !password && <span className='invalid-input'>Enter valid password</span>}

            <div className="role-selector" style={{ margin: '15px 0', width: '300px', display: 'inline-block', textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select Role:</label>
                <select 
                    value={role} 
                    onChange={(e)=>setRole(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <option value="user" style={{ background: '#1e1b4b', color: 'var(--text-primary)' }}>Customer (User Panel)</option>
                    <option value="admin" style={{ background: '#1e1b4b', color: 'var(--text-primary)' }}>Administrator (Admin Dashboard)</option>
                </select>
            </div>

            <button onClick={collectData} className="appButton" type="button" style={{ display: 'block', margin: '20px auto 0' }}>Sign Up</button>
        </div>
    )
}

export default SignUp;