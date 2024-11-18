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
import { useStateContext } from "../context/contextprovider"; // Assuming user state is in context

export default function CustomerProfile() {
  const { user: loggedInUser } = useStateContext(); // Assume logged-in user is fetched from context
  const [user, setUser] = useState(null); // State to hold the user's data
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  });

  useEffect(() => {
    if (loggedInUser) {
      // Simulate fetching user data (or fetch from API)
      setUser({
        name: loggedInUser.name,
        profileImage: loggedInUser.profileImage || "src/assets/default.jpg",
        location: loggedInUser.location || "Unknown Location",
        friends: loggedInUser.friends || 0,
        posts: loggedInUser.posts || [], 
      });

      setFormData({
        name: loggedInUser.name,
        location: loggedInUser.location,
      });
    }
  }, [loggedInUser]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    
    setUser({ ...user, name: formData.name, location: formData.location });
    setEditOpen(false);
    toast.success("Profile updated successfully!");
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
              sx={{ width: 200, height: 200, border: "5px solid white", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
            />
          </div>

          {/* User Information */}
          <div className="text-center">
            <Typography variant="h4" className="font-bold">
              {user.name}
              <IconButton color="inherit" onClick={() => setEditOpen(true)}>
                <Edit />
              </IconButton>
            </Typography>
            <Typography className="text-gray-500 mb-4">{user.location}</Typography>
          </div>

          {/* Tabs for Posts */}
          <Tabs value={activeTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
            <Tab label="Posts" value="posts" />
          </Tabs>

          <div className="mt-4">
            {activeTab === "posts" && (
              <div className="space-y-4">
                {user.posts && user.posts.length > 0 ? (
                  user.posts.map((post) => (
                    <Paper key={post.id} className="p-4 bg-gray-100 rounded-lg shadow">
                      <Typography variant="body1">{post.content}</Typography>
                      {post.comments.length > 0 && (
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
        <Modal open={editOpen} onClose={() => setEditOpen(false)} className="flex items-center justify-center">
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
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleEditChange}
              fullWidth
              margin="normal"
            />
            <a href="/password-change">Change Password</a>
            <div className="flex justify-end mt-4">
              <Button variant="outlined" onClick={() => setEditOpen(false)} className="mr-2">
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
