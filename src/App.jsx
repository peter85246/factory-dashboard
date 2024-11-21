import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./components/auth/LoginPage";
import FactoryDashboard from "./components/FactoryDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<FactoryDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
