// client/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PostGig from "./pages/postGig";
import GigList from "./pages/GigList";
import "./App.css";
import Profile from "./pages/Profile";
import GigDetail from "./pages/GigDetail";

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/post-gig" element={<PostGig />} />
            <Route path="/gigs" element={<GigList />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/gigs/:id" element={<GigDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
