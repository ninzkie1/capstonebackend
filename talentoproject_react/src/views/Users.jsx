import React, { useEffect, useState } from "react";
import axiosClient from "../axiosClient";
import { useOutletContext } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
    role: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { isSidebarOpen } = useOutletContext();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axiosClient.get("/users");
      if (!response || !response.data) {
        throw new Error("No data received");
      }
      setUsers(response.data);
    } catch (error) {
      setError(error.message || "Failed to fetch users");
    }
  };

  const handleEditUser = async (user) => {
    try {
      const response = await axiosClient.get(`/users/${user.id}`); // Fixed the backticks here
      if (response.data) {
        setEditingUser(response.data);
        setFormData({
          name: response.data.name,
          lastname: response.data.lastname,
          email: response.data.email,
          password: "", // Optional, keeping it empty by default
          role: response.data.role,
        });
        setValidationErrors({});
        setIsModalOpen(true);  // Open the edit modal
      }
    } catch (error) {
      setError(error.message || "Failed to fetch user details");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const updatedData = { ...formData };
      if (!updatedData.password) {
        delete updatedData.password;  // If password is not set, omit it
      }
      const response = await axiosClient.put(`/users/${editingUser.id}`, updatedData);  // Fixed the backticks here
      if (response.data.message) {
        fetchUsers();
        setEditingUser(null);
        setIsModalOpen(false);
        toast.success("User updated successfully");
      }
    } catch (error) {
      if (error.response && error.response.data.errors) {
        setValidationErrors(error.response.data.errors);
      } else {
        setError(error.message || "Failed to update user");
      }
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await axiosClient.delete(`/users/${userToDelete.id}`);  // Fixed the backticks here
      if (response.data.message) {
        fetchUsers();
        toast.success("User deleted successfully");
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    } catch (error) {
      setError(error.message || "Failed to delete user");
      toast.error("Failed to delete user");
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: "",
      lastname: "",
      email: "",
      password: "",
      role: "",
    });
    setValidationErrors({});
  };

  // Filter users by their roles
  const performers = users.filter(user => user.role === "performer");
  const clients = users.filter(user => user.role === "client" || user.role === "client");

  return (
    <div className="container mx-auto p-6">
      <ToastContainer />
      <header className="bg-gray-800 shadow w-full">
        <div className="flex justify-center items-center px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            MANAGE USER ACCOUNTS
          </h1>
        </div>
      </header>
      <main className="flex-1 w-full">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : (
            <>
              {/* Performers Table */}
              <h2 className="text-xl font-bold mb-4 text-gray-700">Performers</h2>
              {performers.length > 0 ? (
                <table className="min-w-full table-auto border-collapse border border-gray-300 mb-8">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border px-6 py-3 text-left font-medium text-gray-600 w-1/4">Name</th>
                      <th className="border px-6 py-3 text-left font-medium text-gray-600 w-1/4">Email</th>
                      <th className="border px-6 py-3 text-left font-medium text-gray-600 w-1/4">Role</th>
                      <th className="border px-6 py-3 text-center font-medium text-gray-600 w-1/4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {performers.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="border px-6 py-4">{user.name} {user.lastname}</td>
                        <td className="border px-6 py-4">{user.email}</td>
                        <td className="border px-6 py-4">{user.role}</td>
                        <td className="border px-6 py-4 text-center">
                          <button 
                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 mr-2"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </button>
                          <button 
                            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                            onClick={() => openDeleteModal(user)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No performers found.</p>
              )}

              {/* Clients Table */}
              <h2 className="text-xl font-bold mb-4 text-gray-700">Clients</h2>
              {clients.length > 0 ? (
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border px-6 py-3 text-left font-medium text-gray-600 w-1/4">Name</th>
                      <th className="border px-6 py-3 text-left font-medium text-gray-600 w-1/4">Email</th>
                      <th className="border px-6 py-3 text-left font-medium text-gray-600 w-1/4">Role</th>
                      <th className="border px-6 py-3 text-center font-medium text-gray-600 w-1/4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {clients.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="border px-6 py-4">{user.name} {user.lastname}</td>
                        <td className="border px-6 py-4">{user.email}</td>
                        <td className="border px-6 py-4">{user.role}</td>
                        <td className="border px-6 py-4 text-center">
                          <button 
                            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 mr-2"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </button>
                          <button 
                            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                            onClick={() => openDeleteModal(user)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No clients found.</p>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals for Edit and Delete */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm">{validationErrors.name[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                {validationErrors.lastname && (
                  <p className="text-red-500 text-sm">{validationErrors.lastname[0]}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm">{validationErrors.email[0]}</p>
                )}
              </div>
            
              <div className="relative">
                <label className="block text-gray-700">Password (optional)</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded pr-12" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-1 right-0 flex items-center mt-5 px-3"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-8 w-10 text-gray-500" />
                  ) : (
                    <EyeIcon className="h-8 w-10 text-gray-500" />
                  )}
                </button>
                {validationErrors.password && (
                  <p className="text-red-500 text-sm">{validationErrors.password[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded">
                  <option value="performer">Performer</option>
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                </select>
                {validationErrors.role && (
                  <p className="text-red-500 text-sm">{validationErrors.role[0]}</p>
                )}
              </div>
              <div className="flex justify-end space-x-4">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Update
                </button>
                <button type="button" onClick={closeModal} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete this user?</p>
            <div className="flex justify-end space-x-4 mt-4">
              <button 
                onClick={handleDeleteUser} 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Delete
              </button>
              <button 
                onClick={closeDeleteModal} 
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isUpdateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4">Update Successful</h2>
            <p>The user has been updated successfully.</p>
            <div className="flex justify-end space-x-4 mt-4">
              <button 
                onClick={closeUpdateModal} 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
