import React, { useState, useEffect } from "react";
import {
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  Typography,
  Modal,
  TextField,
  Paper,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosClient from "../axiosClient";
import profilePlaceholder from "../assets/logotalentos.png"; // Placeholder for profile image

export default function CustomerProfile() {
  const [user, setUser] = useState(null); // State to hold the user's data
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    location: "",
    profileImage: null, // File for profile image
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await axiosClient.get("/client-info", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const client = response.data.user;

        // Update the user state with data from the response
        setUser({
          name: client.name,
          lastname: client.lastname,
          profileImage: client?.image_profile
            ? `http://192.168.254.116:8000/storage/${client.image_profile}`
            : profilePlaceholder,
          location: client.location || "Unknown Location",
          friends: client.friends || 0,
          posts: client.posts || [],
        });

        // Set form data for editing purposes
        setFormData({
          name: client.name,
          lastname: client.lastname,
          location: client.location,
          profileImage: null,
        });
      } catch (error) {
        console.error("Error fetching client data:", error);
        toast.error("Failed to load client information.");
      }
    };

    fetchClientData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setFormData({ ...formData, profileImage: e.target.files[0] });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.lastname || !formData.location) {
      toast.error("Please fill out all the required fields.");
      return;
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("lastname", formData.lastname);
    formDataToSend.append("location", formData.location);
    if (formData.profileImage) {
      formDataToSend.append("image_profile", formData.profileImage);
    }

    try {
      const response = await axiosClient.post("/update-profile", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Update user state with new data
      setUser({
        ...user,
        name: response.data.user.name,
        lastname: response.data.user.lastname,
        location: response.data.user.location,
        profileImage: response.data.user.image_profile
          ? `http://192.168.254.116:8000/storage/${response.data.user.image_profile}`
          : user.profileImage,
      });

      setEditOpen(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <Typography>Loading...</Typography>;

  return (
    <div>
      <ToastContainer />

      {/* Main Profile Section */}
      <div className="flex flex-col items-center bg-blue-100 p-4">
        <Paper className="w-full max-w-4xl bg-gray-500 shadow rounded-lg p-6 mt-10">
          {/* Profile Picture */}
          <div className="flex justify-center -mt-20 mb-4">
            <Avatar
              src={user.profileImage}
              alt="Profile"
              sx={{
                width: 200,
                height: 200,
                border: "5px solid white",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}
            />
          </div>

          {/* User Information */}
          <div className="text-center">
            <Typography variant="h4" className="font-bold">
              {user.name} {user.lastname}
              <IconButton color="inherit" onClick={() => setEditOpen(true)}>
                <Edit />
              </IconButton>
            </Typography>
            <Typography className="text-gray-500 mb-4">{user.location}</Typography>
          </div>

          {/* Tabs for Posts */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Posts" value="posts" />
          </Tabs>

          <div className="mt-4">
            {activeTab === "posts" && (
              <div className="space-y-4">
                {user.posts && user.posts.length > 0 ? (
                  user.posts.map((post) => (
                    <Paper key={post.id} className="p-4 bg-gray-100 rounded-lg shadow">
                      <Typography variant="body1">{post.content}</Typography>
                      {post.comments && post.comments.length > 0 && (
                        <div className="mt-2">
                          <Typography variant="subtitle1" className="font-semibold">
                            Comments:
                          </Typography>
                          {post.comments.map((comment, index) => (
                            <Typography key={index} variant="body2" className="pl-4">
                              - {comment}
                            </Typography>
                          ))}
                        </div>
                      )}
                    </Paper>
                  ))
                ) : (
                  <Typography>No posts available</Typography>
                )}
              </div>
            )}
          </div>
        </Paper>

        {/* Edit Profile Modal */}
        <Modal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          className="flex items-center justify-center"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <Typography variant="h5" className="mb-4">
              Edit Profile
            </Typography>
            <TextField
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleEditChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Last Name"
              name="lastname"
              value={formData.lastname}
              onChange={handleEditChange}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleEditChange}
              fullWidth
              margin="normal"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-4"
            />
            <div className="flex justify-end mt-4">
              <Button
                variant="outlined"
                onClick={() => setEditOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
