import React, {useEffect} from 'react'
import {useNavigate} from 'react-router-dom'

import API_BASE_URL from '../config';

const Login=()=>{
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState(false);
    const navigate = useNavigate();
    useEffect(()=>{
        const auth = localStorage.getItem('user');
        if(auth) {
            navigate("/")
        }
    }, [navigate])

    const handleLogin= async () =>{
        if (!email || !password) {
            setError(true);
            return false;
        }

        console.warn("email, password", email, password)
        try {
            let result = await fetch(`${API_BASE_URL}/login`, {
                method: 'post',
                body: JSON.stringify({email, password}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            result = await result.json();
            console.warn(result)
            if (result.auth) {
                localStorage.setItem("user", JSON.stringify(result.user));
                localStorage.setItem("token", JSON.stringify(result.auth));
                navigate("/")
            }
            else {
                alert("please enter correct details")
            }
        } catch (err) {
            console.error("Login Error:", err);
            alert(`Failed to connect to the server at ${API_BASE_URL}. Error: ${err.message}. Please ensure the backend is running.`);
        }
    }

    return(
        <div className="login">
            <h1>Login Page</h1>
            <input type="text" className='inputBox' placeholder='Enter Email' 
            onChange={(e)=>setEmail(e.target.value)} value={email} />
            {error && !email && <span className='invalid-input'>Enter valid email</span>}

            <input type="password" className='inputBox' placeholder='Enter Password'
            onChange={(e)=>setPassword(e.target.value)} value={password} />
            {error && !password && <span className='invalid-input'>Enter valid password</span>}

            <button onClick={handleLogin} className="appButton" type="button">Login</button>
        </div>
    )
}

export default Login