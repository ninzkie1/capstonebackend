import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      {/* ToastContainer added here to handle toast notifications */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      {/* The main router for the application */}
      <RouterProvider router={router} />
    </>
  );
}

export default App;
