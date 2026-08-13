import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ArticleView from "./pages/ArticleView";
import Editor from "./pages/Editor";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/articles/:slug" element={<ArticleView />} />
        <Route
          path="/editor"
          element={
            <ProtectedRoute allowedRoles={["editor", "admin"]}>
              <Editor />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;