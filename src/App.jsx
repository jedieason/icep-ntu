import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import About from './pages/About';
import StudentZone from './pages/StudentZone';
import Resources from './pages/Resources';

function App() {
  return (
    <Router basename="/icep-ntu">
      <Navbar />
      <Routes>
        <Route path="/" element={<About />} />
        <Route path="/about" element={<About />} />
        <Route path="/student-zone" element={<StudentZone />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="*" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;
