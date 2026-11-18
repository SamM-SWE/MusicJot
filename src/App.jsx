import { Routes, Route } from "react-router-dom";
import './App.css'
import Home from "./screens/Home";
import CreatePost from "./screens/CreatePost";
import FullDetail from "./screens/FullDetail";
import EditPost from "./screens/EditPost";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/CreatePost" element={<CreatePost />} />
      <Route path="/posts/:id" element={<FullDetail />} />
      <Route path="/post/edit/:id" element={<EditPost />} />
    </Routes>

  )
}

export default App
