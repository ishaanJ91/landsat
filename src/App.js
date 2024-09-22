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

axios.defaults.baseURL = 'http://localhost:3001';

function App() {
    return (
        <Routes>
            <Route path={"/"} element={<Layout/>}>
            <Route index element={<HomePage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/target-location" element={<TargetLocation />} />
            </Route>
        </Routes>
    );
};

export default App;