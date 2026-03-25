import { useState } from 'react';
// import './App.css';
import { Routes, Route } from "react-router";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import NavHeader from "./components/NavHeader.jsx";

function App() {
  const [user, setUser] = useState(null);
    async function login(user = null) {  setUser(user);    }
    async function logout() { setUser(null); }

  return (
      <div className="App">
          <NavHeader />
          <Routes>
              <Route path="/" element={<Home user={user}/>}></Route>
              <Route path="/login" element={<Login user={user}/>}></Route>
          </Routes>
      </div>
  )
}

export default App
