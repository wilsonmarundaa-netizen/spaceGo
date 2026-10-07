import { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css';
import Map from "./pages/Map";

function App() {
  

  return (
    <>
      
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Map/>}/>
            </Routes>
        </BrowserRouter>
                

      
    </>
  )
}

export default App
