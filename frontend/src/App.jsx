import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import Home from "./components/Home.jsx";
import Discover from "./components/Discover.jsx";
import Search from "./components/Search.jsx";
import Profile from "./components/Profile.jsx";
import LandingPage from "./components/LandingPage.jsx";

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem("token") !== null;
  };
  
  const PrivateRoute = ({ element }) => {
    return isAuthenticated() ? (
      element
    ) : (
      <Navigate to="/login"/>
    );
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/discover" element={<PrivateRoute element={<Discover/>}/>}/>
      <Route path="/search" element={<PrivateRoute element={<Search/>}/>}/>
      <Route path="/home" element={<PrivateRoute element={<Home/>}/>}/>
      <Route path="/profile" element={<PrivateRoute element={<Profile/>}/>}/>
      <Route path="*" element={<h1>Not Found</h1>}/>
    </Routes>
  );
}

export default App;
