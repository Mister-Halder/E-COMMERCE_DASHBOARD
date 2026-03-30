import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Nav=()=>{
    const auth = localStorage.getItem('user');
    const navigate = useNavigate();
    const location = useLocation();
    const user = auth ? JSON.parse(auth) : null;

    const logout=()=>{
        localStorage.clear();
        navigate('/signup')
    }
    return(
        <nav>
            { auth ? <ul className="nav-ul">
                <li>
                    <img alt="logo" className='logo' 
                    src={`${process.env.PUBLIC_URL}/logo.png`} />
                </li>
                <li><Link to="/">Products</Link></li>
                <li><Link to="/add">Add Product</Link></li>
                { location.pathname.includes('/update') && 
                    <li><Link to={location.pathname} style={{ color: 'var(--primary-color)' }}>Update Product</Link></li> 
                }
                <li style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid var(--primary-color)',
                        background: 'rgba(255,255,255,0.1)',
                        marginRight: '-10px', // Pull it closer to the text
                        zIndex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)'
                    }}>
                        {user.profileImage ? (
                            <img src={user.profileImage} alt="nav-profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span>{user.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <Link to="/profile">Profile</Link>
                </li>
                <li className="nav-right"><Link onClick={logout} to="/signup" className="logout-btn">Logout ({user.name})</Link></li>
            </ul>
            :
            <ul className="nav-ul nav-right">
                <li><Link to="/signup">Sign Up</Link></li>
                <li><Link to="/login">Login</Link></li>
            </ul>
            }
        </nav>
    )
}

export default Nav;