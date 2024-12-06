import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await axiosClient.get("/complaints");
        setComplaints(response.data);
      } catch (error) {
        console.error("Error fetching complaints:", error);
      }
    };
    fetchComplaints();
  }, []);

  const handleResponse = async (id, responseText) => {
    try {
      const res = await axiosClient.put(`/complaints/${id}/respond`, {
        response: responseText,
      });
      toast.success(res.data.message);
      // Update the complaints list with the new response data
      setComplaints((prev) =>
        prev.map((complaint) =>
          complaint.id === id ? { ...complaint, ...res.data.complaint } : complaint
        )
      );
    } catch (error) {
      console.error("Error responding to complaint:", error);
      toast.error("An error occurred while responding to the complaint.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <ToastContainer />
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Manage Complaints</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {complaints.map((complaint) => (
            <div key={complaint.id} className="bg-white rounded-lg shadow-md p-6">
              {/* User Details Section */}
              <div className="flex items-center mb-4">
                {complaint.user?.profilePicture && (
                  <img
                    src={complaint.user.profilePicture}
                    alt={`${complaint.user.name}'s profile`}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div>
                  <p className="text-lg font-semibold text-gray-800">{complaint.user?.name}</p>
                  <p className="text-gray-500 text-sm">{complaint.user?.email}</p>
                </div>
              </div>
              {/* Complaint Details Section */}
              <h4 className="text-xl font-semibold text-gray-800 mb-2">{complaint.title}</h4>
              <p className="text-gray-700 mb-2">{complaint.description}</p>
              <p className="text-gray-500 mb-4">
                <span className="font-semibold">Status:</span> {complaint.status}
              </p>
              {/* Admin Response Section */}
              {complaint.response ? (
                <p className="text-green-600">
                  <span className="font-semibold">Response:</span> {complaint.response}
                </p>
              ) : (
                <button
                  className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors mt-2"
                  onClick={() => {
                    const responseText = prompt("Enter your response:");
                    if (responseText) {
                      handleResponse(complaint.id, responseText);
                    }
                  }}
                >
                  Respond
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
