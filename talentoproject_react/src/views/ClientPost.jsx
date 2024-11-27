import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Grid,
  Skeleton,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useStateContext } from "../context/contextprovider";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export default function ClientPost() {
  const talents = ["Singer", "Dancer", "Musician", "Band", "DJ", "Others"];
  const { user } = useStateContext();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [themes, setThemes] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [postForm, setPostForm] = useState(initialPostFormState());
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customTalent, setCustomTalent] = useState("");
  const [showCustomTalentField, setShowCustomTalentField] = useState(false);

  // Initial state for the form
  function initialPostFormState() {
    return {
      id: null,
      clientName: user ? user.name : "",
      eventId: "",
      themeId: "",
      date: dayjs().format("YYYY-MM-DD"),
      startTime: dayjs().format("HH:mm"),
      endTime: dayjs().add(1, "hour").format("HH:mm"),
      audience: 1,
      performer_needed: 1,
      municipalityId: "",
      barangayId: "",
      description: "",
      talents: [],
    };
  }

  // Fetch posts initially
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/posts");
      const postsData = response.data.map((post) => ({
        ...post,
        talents: Array.isArray(post.talents) ? post.talents : JSON.parse(post.talents),
        comments: post.comments || [],
      }));
      setPosts(postsData);
      setFilteredPosts(postsData);
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

  // Fetch events, municipalities, and themes initially
  useEffect(() => {
    fetchPosts();
    fetchEvents();
    fetchMunicipalities();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axiosClient.get("/events");
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchThemesByEvent = async (eventId) => {
    try {
      const response = await axiosClient.get(`/events/${eventId}/themes`);
      setThemes(response.data);
    } catch (error) {
      console.error("Error fetching themes:", error);
    }
  };

  const fetchMunicipalities = async () => {
    try {
      const response = await axiosClient.get("/municipalities");
      setMunicipalities(response.data);
    } catch (error) {
      console.error("Error fetching municipalities:", error);
    }
  };

  const fetchBarangaysByMunicipality = async (municipalityId) => {
    try {
      const response = await axiosClient.get(`/municipalities/${municipalityId}/barangays`);
      setBarangays(response.data);
    } catch (error) {
      console.error("Error fetching barangays:", error);
    }
  };

  useEffect(() => {
    if (postForm.eventId) {
      fetchThemesByEvent(postForm.eventId);
    }
  }, [postForm.eventId]);

  useEffect(() => {
    if (postForm.municipalityId) {
      fetchBarangaysByMunicipality(postForm.municipalityId);
    }
  }, [postForm.municipalityId]);

  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setPostForm({ ...postForm, [name]: value });
  };

  const handleEdit = (post) => {
    setPostForm({
      id: post.id,
      clientName: post.client_name,
      eventId: post.event_id,
      themeId: post.theme_id,
      date: dayjs(post.date).format("YYYY-MM-DD"),
      startTime: dayjs(post.start_time, "HH:mm:ss").format("HH:mm"),
      endTime: dayjs(post.end_time, "HH:mm:ss").format("HH:mm"),
      performer_needed: post.performer_needed,
      audience: post.audience,
      municipalityId: post.municipality_id,
      barangayId: post.barangay_id,
      description: post.description,
      talents: Array.isArray(post.talents) ? post.talents : post.talents.split(","),
    });
    setShowCustomTalentField(post.talents.includes("Others"));
    setShowFormPopup(true);
    handleCloseMenu(); // Close the menu after clicking edit
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const requestData = {
      client_name: postForm.clientName,
      event_id: postForm.eventId,
      theme_id: postForm.themeId,
      date: dayjs(postForm.date).format("MM/DD/YYYY"),
      start_time: dayjs(postForm.startTime, ["HH:mm", "h:mm A"]).format("h:mm A"),
      end_time: dayjs(postForm.endTime, ["HH:mm", "h:mm A"]).format("h:mm A"),
      audience: parseInt(postForm.audience, 10),
      performer_needed: parseInt(postForm.performer_needed, 10),
      municipality_id: postForm.municipalityId,
      barangay_id: postForm.barangayId,
      description: postForm.description,
      talents: postForm.talents,
    };

    setLoading(true);
    try {
      if (postForm.id) {
        await axiosClient.put(`/posts/${postForm.id}`, requestData);
      } else {
        await axiosClient.post("/posts", requestData);
      }

      fetchPosts();
      handleCloseForm(); // Reset the form after submission
    } catch (error) {
      if (error.response && error.response.data) {
        console.error("Validation errors:", error.response.data);
        alert(
          "Failed to save the post. Please check all required fields and try again.\n" +
          JSON.stringify(error.response.data, null, 2)
        );
      } else {
        console.error("Unexpected error:", error);
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTalentChange = (talent) => {
    setPostForm((prevForm) => {
      let updatedTalents;
      if (prevForm.talents.includes(talent)) {
        updatedTalents = prevForm.talents.filter((t) => t !== talent);
      } else {
        updatedTalents = [...prevForm.talents, talent];
      }

      // Show or hide the custom talent field
      if (talent === "Others") {
        setShowCustomTalentField(!prevForm.talents.includes(talent));
      }

      return { ...prevForm, talents: updatedTalents };
    });
  };

  const handleCustomTalentChange = (e) => {
    const value = e.target.value;
    setCustomTalent(value);
    setPostForm((prevForm) => {
      const updatedTalents = prevForm.talents.filter((t) => t !== customTalent && t !== "Others");
      if (value.trim() !== "") {
        updatedTalents.push(value);
      }
      return { ...prevForm, talents: updatedTalents };
    });
  };

  const handleCommentChange = (postId, value) => {
    setComments({ ...comments, [postId]: value });
  };

  const handleCommentSubmit = async (postId) => {
    const commentContent = comments[postId].trim();
    if (!commentContent) {
      alert("Comment cannot be empty");
      return;
    }

    setLoading(true);
    try {
      await axiosClient.post(`/posts/${postId}/comments`, {
        user_id: user.id,
        content: commentContent,
      });

      fetchPosts();
      setComments({ ...comments, [postId]: "" });
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit the comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    setLoading(true);
    try {
      await axiosClient.delete(`/posts/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete the post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    setPostForm(initialPostFormState());
    setCustomTalent(""); // Clear custom talent field
    setShowCustomTalentField(false); // Hide custom talent field when adding new post
    setShowFormPopup(true);
  };

  const handleCloseForm = () => {
    setPostForm(initialPostFormState());
    setShowFormPopup(false);
  };

  const handleMenuClick = (event, post) => {
    setAnchorEl(event.currentTarget);
    setSelectedPost(post);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedPost(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    filterPosts(e.target.value);
  };

  const filterPosts = (searchValue) => {
    if (searchValue.trim() === "") {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter((post) => {
        const searchText = searchValue.toLowerCase();

        return (
          (post.client_name && post.client_name.toLowerCase().includes(searchText)) ||
          (post.event_name && post.event_name.toLowerCase().includes(searchText)) ||
          (post.theme_name && post.theme_name.toLowerCase().includes(searchText)) ||
          (post.description && post.description.toLowerCase().includes(searchText)) ||
          (post.municipality_name && post.municipality_name.toLowerCase().includes(searchText)) ||
          (post.barangay_name && post.barangay_name.toLowerCase().includes(searchText)) ||
          (Array.isArray(post.talents) &&
            post.talents.some((talent) => talent.toLowerCase().includes(searchText)))
        );
      });
      setFilteredPosts(filtered);
    }
  };

  return (
    <div className="p-4">
      <header className="mb-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Post Your Urgent Event!</h1>
        {user.role === "client" && (
          <Button
            onClick={handleOpenForm}
            variant="contained"
            color="primary"
            className="p-2"
            sx={{ marginBottom: "16px" }}
          >
            Submit a Request
          </Button>
        )}
      </header>

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

      {/* Modal for creating or editing posts */}
      <Modal open={showFormPopup} onClose={handleCloseForm}>
        <Box
          sx={{
            width: "90%",
            maxWidth: 600,
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
            <div className="mb-4">
              <label className="block text-gray-700">Event Name</label>
              <select
                name="eventId"
                value={postForm.eventId}
                onChange={handlePostChange}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Theme Name</label>
              <select
                name="themeId"
                value={postForm.themeId}
                onChange={handlePostChange}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Theme</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              label="Date"
              name="date"
              type="date"
              value={dayjs(postForm.date).format("YYYY-MM-DD")}
              onChange={handlePostChange}
              fullWidth
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
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
              InputLabelProps={{ shrink: true }}
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
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Audience"
              name="audience"
              type="number"
              value={postForm.audience}
              onChange={handlePostChange}
              fullWidth
              margin="normal"
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Performer Needed"
              name="performer_needed"
              type="number"
              value={postForm.performer_needed}
              onChange={handlePostChange}
              fullWidth
              margin="normal"
              inputProps={{ min: 1 }}
            />
            <div className="mb-4">
              <label className="block text-gray-700">Select Municipality</label>
              <select
                name="municipalityId"
                value={postForm.municipalityId}
                onChange={handlePostChange}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Municipality</option>
                {municipalities.map((municipality) => (
                  <option key={municipality.id} value={municipality.id}>
                    {municipality.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Select Barangay</label>
              <select
                name="barangayId"
                value={postForm.barangayId}
                onChange={handlePostChange}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">Select Barangay</option>
                {barangays.map((barangay) => (
                  <option key={barangay.id} value={barangay.id}>
                    {barangay.name}
                  </option>
                ))}
              </select>
            </div>
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
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, marginBottom: 2 }}>
              {talents.map((talent) => (
                <Button
                  key={talent}
                  variant={postForm.talents.includes(talent) ? "contained" : "outlined"}
                  onClick={() => handleTalentChange(talent)}
                >
                  {talent}
                </Button>
              ))}
            </Box>

            {showCustomTalentField && (
              <TextField
                label="Others: (Specify Talent)"
                name="others"
                value={customTalent}
                onChange={handleCustomTalentChange}
                fullWidth
                margin="normal"
              />
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
              <Button variant="outlined" onClick={handleCloseForm} sx={{ marginRight: 1 }}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" type="submit" disabled={user.role !== "client"}>
                {postForm.id ? "Update Request" : "Submit Request"}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      {/* Rest of the UI, displaying posts, etc */}
      <Grid container spacing={3} className="mt-4">
        {loading ? (
          [1, 2, 3, 4].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" width="100%" height={150} />
            </Grid>
          ))
        ) : (
          filteredPosts.map((post) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={post.id}>
              <motion.div whileHover={{ scale: 1.05 }} className="card-wrapper">
                <Card sx={{ marginBottom: 2 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", marginBottom: 1, justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        {post.user?.image_profile ? (
                          <Avatar
                            src={`http://192.168.1.23:8000/storage/${post.user.image_profile}`}
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
                      </Box>
                      {user && user.id === post.user_id && (
                        <>
                          <IconButton onClick={(event) => handleMenuClick(event, post)}>
                            <MoreVertIcon />
                          </IconButton>
                          <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl) && selectedPost?.id === post.id}
                            onClose={handleCloseMenu}
                          >
                            <MenuItem onClick={() => handleEdit(post)}>
                              <EditIcon fontSize="small" sx={{ marginRight: 1 }} /> Edit
                            </MenuItem>
                            <MenuItem onClick={() => handleDelete(post.id)}>
                              <DeleteIcon fontSize="small" sx={{ marginRight: 1 }} /> Delete
                            </MenuItem>
                          </Menu>
                        </>
                      )}
                    </Box>

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
                      <strong>Categories:</strong> {post.talents.join(", ")}
                    </Typography>

                    {/* Comment Section */}
                    {user.role === "performer" && (
                      <Box sx={{ marginTop: 3 }}>
                        <TextField
                          fullWidth
                          label="Add Comment"
                          value={comments[post.id] || ""}
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          margin="normal"
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleCommentSubmit(post.id)}
                          disabled={loading}
                        >
                          Submit Comment
                        </Button>
                      </Box>
                    )}
                    <Box sx={{ marginTop: 3 }}>
                      <Typography variant="h6">Comments:</Typography>
                      <Box
                        sx={{
                          height: 200,
                          overflowY: "auto",
                          marginTop: 2,
                          padding: 1,
                          border: "1px solid #ccc",
                          borderRadius: 1,
                        }}
                      >
                        {post.comments && post.comments.length > 0 ? (
                          post.comments.map((comment, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: 2,
                                padding: 1,
                                borderBottom: "1px solid #e0e0e0",
                              }}
                            >
                              {comment.user?.avatar ? (
                                <Avatar src={comment.user.avatar} alt={comment.user.name} sx={{ marginRight: 1 }} />
                              ) : (
                                <Avatar sx={{ bgcolor: "#2196f3", marginRight: 1 }}>
                                  <AccountCircleIcon />
                                </Avatar>
                              )}
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  <strong>{comment.user ? comment.user.name : "Unknown User"}</strong>
                                  <span style={{ marginLeft: 8, fontStyle: "italic", fontSize: "0.9em" }}>
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {comment.content}
                                </Typography>
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="textSecondary" sx={{ marginLeft: 2 }}>
                            No comments yet.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))
        )}
      </Grid>
    </div>
  );
}
