import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient"; 
import {
  Modal,
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useStateContext } from "../context/contextprovider";
import { useOutletContext } from "react-router-dom";
import dayjs from "dayjs";

export default function AdminPost() {
  const talents = ["Singer", "Dancer", "Musician", "Band", "Entertainer", "DJ"];
  const { user } = useStateContext();
  const { isSidebarOpen } = useOutletContext();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Added search term state
  const [postForm, setPostForm] = useState({
    id: null,
    clientName: user ? user.name : "",
    eventName: "",
    themeName: "",
    municipality: "",
    barangay: "",
    date: dayjs().format("YYYY-MM-DD"),
    startTime: "",
    endTime: "",
    audience: 1,
    performerNeeded: 1,
    description: "",
    talents: [],
  });
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch all posts from the API using axios
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/posts");
      const postsData = response.data;

      setPosts(postsData);
      setFilteredPosts(postsData); // Initialize filtered posts with all posts

      const initialComments = {};
      postsData.forEach((post) => {
        initialComments[post.id] = "";
      });
      setComments(initialComments);
    } catch (error) {
      console.error("Error fetching posts:", error);
      alert("Failed to fetch posts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setPostForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleEdit = (post) => {
    setPostForm({
      id: post.id,
      clientName: post.client_name,
      eventName: post.event_name,
      themeName: post.theme_name,
      municipality: post.municipality_name,
      barangay: post.barangay_name,
      date: dayjs(post.date).format("YYYY-MM-DD"),
      startTime: dayjs(post.start_time, "HH:mm:ss").format("HH:mm"),
      endTime: dayjs(post.end_time, "HH:mm:ss").format("HH:mm"),
      audience: post.audience,
      performerNeeded: post.performer_needed,
      description: post.description,
      talents: Array.isArray(post.talents) ? post.talents : post.talents.split(","),
    });
    setShowFormPopup(true);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const requestData = { ...postForm };

      if (postForm.id) {
        await axiosClient.put(`/posts/${postForm.id}`, requestData);
      } else {
        await axiosClient.post("/posts", requestData);
      }

      await fetchPosts(); // Refresh posts after submit
      setPostForm({
        id: null,
        clientName: user ? user.name : "",
        eventName: "",
        themeName: "",
        municipality: "",
        barangay: "",
        date: dayjs().format("YYYY-MM-DD"),
        startTime: "",
        endTime: "",
        audience: 1,
        performerNeeded: 1,
        description: "",
        talents: [],
      });
      setShowFormPopup(false);
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save the post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (confirmDelete) {
      setLoading(true);
      try {
        await axiosClient.delete(`/posts/${postId}`);
        await fetchPosts(); // Refresh posts after delete
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete the post. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTalentChange = (talent) => {
    setPostForm((prevForm) => {
      const updatedTalents = prevForm.talents.includes(talent)
        ? prevForm.talents.filter((t) => t !== talent)
        : [...prevForm.talents, talent];
      return { ...prevForm, talents: updatedTalents };
    });
  };

  const handleCommentSubmit = async (postId) => {
    const comment = comments[postId].trim();
    if (comment) {
      setLoading(true);
      try {
        await axiosClient.post(`/posts/${postId}/comments`, {
          user_id: user.id,
          content: comment,
        });
        await fetchPosts(); // Refresh posts after comment submit
        setComments((prevComments) => ({
          ...prevComments,
          [postId]: "",
        }));
      } catch (error) {
        console.error("Error submitting comment:", error);
        alert("Failed to submit the comment. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Comment cannot be empty");
    }
  };

  // Filter handling logic
  const handleFilterChange = (talent) => {
    setActiveFilters((prevFilters) =>
      prevFilters.includes(talent)
        ? prevFilters.filter((filter) => filter !== talent)
        : [...prevFilters, talent]
    );
  };

  // Update filtered posts when active filters, search term, or posts change
  useEffect(() => {
    let filtered = posts;

    // Apply talent filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter((post) =>
        post.talents.some((talent) => activeFilters.includes(talent))
      );
    }

    // Apply search term filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((post) => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
          post.event_name.toLowerCase().includes(lowerCaseSearchTerm) ||
          post.theme_name.toLowerCase().includes(lowerCaseSearchTerm) ||
          post.municipality_name.toLowerCase().includes(lowerCaseSearchTerm) ||
          post.barangay_name.toLowerCase().includes(lowerCaseSearchTerm) ||
          post.description.toLowerCase().includes(lowerCaseSearchTerm) ||
          post.talents.some((talent) => talent.toLowerCase().includes(lowerCaseSearchTerm))
        );
      });
    }

    setFilteredPosts(filtered);
  }, [activeFilters, searchTerm, posts]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex-1 p-4">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-center mb-4">
            Urgent Hiring Talent!
          </h1>
        </header>

        {user?.role === "client" && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowFormPopup(true)}
              className="p-2 bg-blue-500 text-white rounded-md"
            >
              Submit a Request
            </button>
          </div>
        )}

        {/* Search Bar */}
        <Box sx={{ textAlign: "center", marginBottom: 3 }}>
          <TextField
            label="Search Posts"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            fullWidth
            sx={{ maxWidth: 600, mx: "auto" }}
          />
        </Box>

        {/* Filter Section */}
        <div className="flex justify-center my-4 space-x-4">
          {talents.map((talent) => (
            <Button
              key={talent}
              variant={activeFilters.includes(talent) ? "contained" : "outlined"}
              onClick={() => handleFilterChange(talent)}
            >
              {talent}
            </Button>
          ))}
        </div>

        <div className="container mx-auto mt-8">
          <Typography variant="h6" gutterBottom>
            List of Submitted Requests:
          </Typography>

          {loading ? (
            <CircularProgress />
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Card key={post.id} sx={{ marginBottom: 2 }}>
                <CardContent>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                    {post.user?.image_profile ? (
                      <Avatar
                        src={post.user.image_profile}
                        alt={post.client_name}
                        sx={{ marginRight: 2 }}
                      />
                    ) : (
                      <Avatar sx={{ bgcolor: "#2196f3", marginRight: 2 }}>
                        <AccountCircleIcon />
                      </Avatar>
                    )}
                    <Typography variant="h6" component="div">
                      {post.client_name}
                    </Typography>
                  </div>

                  <Typography variant="body1" color="textPrimary">
                    <strong>Event Name:</strong> {post.event_name}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    <strong>Theme Name:</strong> {post.theme_name}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    <strong>Location:</strong> {post.municipality_name}, {post.barangay_name}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    <strong>Date:</strong> {dayjs(post.date).format("MM/DD/YYYY")}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    <strong>Start Time:</strong> {dayjs(post.start_time, "HH:mm:ss").format("hh:mm A")}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    <strong>End Time:</strong> {dayjs(post.end_time, "HH:mm:ss").format("hh:mm A")}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    <strong>Audience:</strong> {post.audience}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    <strong>Performer Needed:</strong> {post.performer_needed}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    <strong>Description:</strong> {post.description}
                  </Typography>
                  <Typography variant="body1" color="textPrimary">
                    <strong>Categories:</strong> {Array.isArray(post.talents) ? post.talents.join(", ") : post.talents}
                  </Typography>

                  {user?.role === "admin" && (
                    <div style={{ marginTop: 16 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleEdit(post)}
                        style={{ marginRight: 8 }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleDelete(post.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}

                  {/* Comment Section */}
                  <div style={{ marginTop: 16 }}>
                    <TextField
                      fullWidth
                      label="Add Comment"
                      value={comments[post.id] || ""}
                      onChange={(e) =>
                        setComments((prevComments) => ({
                          ...prevComments,
                          [post.id]: e.target.value,
                        }))
                      }
                      margin="normal"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleCommentSubmit(post.id)}
                    >
                      Submit Comment
                    </Button>
                  </div>

                  <Typography variant="h6" style={{ marginTop: 25 }}>
                    Comments:
                  </Typography>
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment, index) => (
                      <div
                        key={index}
                        style={{
                          marginLeft: 20,
                          marginBottom: 10,
                          border: "1px solid #ccc",
                          borderRadius: 4,
                          padding: 8,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {comment.user?.avatar ? (
                          <Avatar
                            src={comment.user.avatar}
                            alt={comment.user.name}
                            sx={{ marginRight: 2 }}
                          />
                        ) : (
                          <Avatar sx={{ bgcolor: "#2196f3", marginRight: 2 }}>
                            <AccountCircleIcon />
                          </Avatar>
                        )}
                        <div>
                          <Typography variant="body2" color="textSecondary">
                            <strong>{comment.user ? comment.user.name : "Unknown User"}</strong>
                            <span
                              style={{
                                marginLeft: 8,
                                fontStyle: "italic",
                                fontSize: "0.9em",
                              }}
                            >
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            - {comment.content}
                          </Typography>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      style={{ marginLeft: 16 }}
                    >
                      No comments yet.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No posts available.
            </Typography>
          )}
        </div>

        {/* Modal for submitting/editing post */}
        <Modal open={showFormPopup} onClose={() => setShowFormPopup(false)}>
          <Box
            sx={{
              width: "90%",
              maxWidth: "600px",
              maxHeight: "90vh",
              bgcolor: "background.paper",
              padding: 4,
              borderRadius: 2,
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              boxShadow: 24,
              overflowY: "auto",
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              {postForm.id ? "Edit Your Request" : "Submit a Request"}
            </Typography>
            <form onSubmit={handlePostSubmit}>
              <TextField
                label="Client Name"
                name="clientName"
                value={postForm.clientName}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
                disabled
              />
              <TextField
                label="Event Name"
                name="eventName"
                value={postForm.eventName}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Theme Name"
                name="themeName"
                value={postForm.themeName}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Municipality"
                name="municipality"
                value={postForm.municipality}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Barangay"
                name="barangay"
                value={postForm.barangay}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Date"
                name="date"
                type="date"
                value={dayjs(postForm.date).format("YYYY-MM-DD")}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="Start Time"
                name="startTime"
                type="time"
                value={postForm.startTime}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
                required
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min intervals
                }}
              />
              <TextField
                label="End Time"
                name="endTime"
                type="time"
                value={postForm.endTime}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
                required
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min intervals
                }}
              />
              <TextField
                label="Audience"
                name="audience"
                type="number"
                value={postForm.audience}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Performer Needed"
                name="performerNeeded"
                type="number"
                value={postForm.performerNeeded}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Description"
                name="description"
                value={postForm.description}
                onChange={handlePostChange}
                fullWidth
                margin="normal"
                multiline
                rows={3}
                required
              />
              <Typography variant="subtitle1">Select Talents:</Typography>
              {talents.map((talent) => (
                <FormControlLabel
                  key={talent}
                  control={
                    <Checkbox
                      checked={postForm.talents.includes(talent)}
                      onChange={() => handleTalentChange(talent)}
                    />
                  }
                  label={talent}
                />
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setShowFormPopup(false)}
                  style={{ marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button variant="contained" color="primary" type="submit">
                  {postForm.id ? "Update Request" : "Submit Request"}
                </Button>
              </div>
            </form>
          </Box>
        </Modal>
      </div>
    </div>
  );
}
