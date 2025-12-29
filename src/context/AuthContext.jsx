import React, { useState, createContext, useContext } from "react";
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext(null);

const getInitialUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    localStorage.removeItem('user');
    return null;
  }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getInitialUser());
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(false);
    const [skipped, setSkipped] = useState(false);

    const login = async (email, password) => {
        try {
            const data = await loginUser({ email, password });
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
            }
            return data;
        } catch (error) {
            // The error from api.js is an ApiError. Its .message property is 
            // already the user-friendly message from the server's 'msg' field.
            // We re-throw a standard error to be caught by the UI component.
            throw new Error(error.message);
        }
    };

    const register = async (userData) => {
        try {
            const data = await registerUser(userData);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
            }
            return data;
        } catch (error) {
            // Re-throw a standard error with the specific message from the server.
            throw new Error(error.message);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setSkipped(false);
    };

    const skipLogin = () => {
        setSkipped(true);
    };

    const unskip = () => {
        setSkipped(false);
    };

    const value = { 
        user,
        token,
        loading,
        skipped,
        login,
        register,
        logout,
        skipLogin,
        unskip,
        isAuthenticated: !!token,
        userRole: user ? user.role : 'guest',
        isAuthority: user && (user.role === 'authority' || user.role === 'super_admin'),
        isSuperAdmin: user && user.role === 'super_admin',
        firstName: user ? user.firstName : 'Guest',
        departmentId: user ? user.departmentId : null,
        isEmailVerified: true,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
