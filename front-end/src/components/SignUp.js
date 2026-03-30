import React, {useState, useEffect} from 'react'

import {useNavigate} from 'react-router-dom'

const SignUp=()=>{
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    useEffect(()=>{
        const auth = localStorage.getItem('user');
        if(auth) {
            navigate('/')
        }
    }, [])

    const collectData = async () => {
        if (!name || !email || !password) {
            setError(true);
            return false;
        }

        console.warn(name, email, password);
        let result = await fetch("http://localhost:5000/register", {
            method: 'post',
            body: JSON.stringify({ name, email, password }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        result = await result.json();
        console.warn(result);
        if (result && result.auth) {
            localStorage.setItem("user", JSON.stringify(result.user));
            localStorage.setItem("token", JSON.stringify(result.auth));
            navigate('/')
        } else {
            alert("Please enter valid details");
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

            <button onClick={collectData} className="appButton" type="button">Sign Up</button>
        </div>
    )
}

export default SignUp;