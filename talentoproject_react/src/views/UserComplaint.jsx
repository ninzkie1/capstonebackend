import React, { useState } from "react";
import axiosClient from "../axiosClient";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function UserComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosClient.post("/complaints", {
        title,
        description,
      });
      toast.success(`${response.data.message} Please check your email for further instructions.`);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("An error occurred while submitting your complaint. Please try again later.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <ToastContainer />
      <div className="w-full max-w-lg bg-white/30 backdrop-blur-md rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">
          Submit a Complaint
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            Submit Complaint
          </button>
        </form>
      </div>
    </div>
  );
}
