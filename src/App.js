import React from 'react';
import HomePage from './component/HomePage';
import Register from './component/Register';
import Layout from './component/Layout';
import Login from './component/Login';
import Dashboard from './component/Dashboard';
import TargetLocation from './component/TargetLocation';

import { Route, Routes } from 'react-router-dom'
import { Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { UserContextProvider } from './component/UserContext';

axios.defaults.baseURL = 'http://localhost:3001';
axios.defaults.withCredentials = true;

function App() {
    
    return (
        <UserContextProvider>
            <Routes>
            <Route index element={<HomePage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/target-location" element={<TargetLocation />} />

        </Routes>
        </UserContextProvider>
    );
};

export default App;