import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import Logo from "../assets/logotalentos.png";
import {
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
import { useOutletContext, useNavigate } from "react-router-dom";
import dayjs from "dayjs";


export default function Post() {
  const talents = ["Singer", "Dancer", "Musician", "Band", "Entertainer", "DJ"];
  const { user } = useStateContext();
  const { isSidebarOpen } = useOutletContext();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get("/posts");
      const postsData = response.data;
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
      await fetchPosts();
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
        await fetchPosts();
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
        await fetchPosts();
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

  const handleApply = async (postId) => {
    if (!user || user.role !== "performer") {
      alert("You need to be logged in as a performer to apply.");
      return;
    }
  
    setLoading(true);
    try {
      const response = await axiosClient.post(`/posts/${postId}/apply`);
      alert(response.data.message);
      // Optionally, refresh the list or update application status in the UI
      fetchPosts();
    } catch (error) {
      console.error("Error applying for the post:", error);
      alert(
        error.response?.data?.message ||
          "Failed to apply for the post. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  

  const handleMessage =() => {
    navigate('/ChatApplicants');
  };

  const handleFilterChange = (talent) => {
    setActiveFilters((prevFilters) =>
      prevFilters.includes(talent)
        ? prevFilters.filter((filter) => filter !== talent)
        : [...prevFilters, talent]
    );
  };

  useEffect(() => {
    let filtered = posts;
    if (activeFilters.length > 0) {
      filtered = filtered.filter((post) =>
        post.talents.some((talent) => activeFilters.includes(talent))
      );
    }
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
      <div className="flex-1 p-4 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-lg">
        <header className="mb-6 text-center">
          <Typography variant="h4" fontWeight="bold" sx={{ color: "#0D47A1" }}>
            Urgent Hiring Talent!
          </Typography>
        </header>

        {/* Search Bar */}
        <Box sx={{ textAlign: "center", marginBottom: 3 }}>
          <TextField
            label="Search Posts"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            fullWidth
            sx={{
              maxWidth: 600,
              mx: "auto",
              backgroundColor: "white",
              borderRadius: 1,
            }}
          />
        </Box>

        {/* Filter Section */}
        <Box className="flex justify-center my-4 space-x-2">
          {talents.map((talent) => (
            <Button
              key={talent}
              variant={activeFilters.includes(talent) ? "contained" : "outlined"}
              onClick={() => handleFilterChange(talent)}
              sx={{
                color: activeFilters.includes(talent) ? "#fff" : "#0D47A1",
                backgroundColor: activeFilters.includes(talent) ? "#0D47A1" : "transparent",
                borderColor: "#0D47A1",
                '&:hover': {
                  backgroundColor: "#0D47A1",
                  color: "#fff",
                },
              }}
            >
              {talent}
            </Button>
          ))}
        </Box>

        <Typography variant="h6" sx={{ marginTop: 3, color: "#0D47A1" }}>
          List of Submitted Requests:
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Card key={post.id} sx={{ marginTop: 3, borderRadius: 2, backgroundColor: "#F5F5F5" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar
                src={
                  post.user?.image_profile
                    ? `http://192.168.254.115:8000/storage/${post.user.image_profile}`
                    : Logo
                }
                alt={post.client_name}
                sx={{
                  marginRight: 2,
                  width: 48,
                  height: 48,
                  backgroundColor: post.user?.image_profile ? "transparent" : "#0D47A1",
                }}
              >
                {!post.user?.image_profile && <AccountCircleIcon />}
              </Avatar>


                  <Typography variant="h6" fontWeight="bold" color="#0D47A1">
                    {post.client_name}
                  </Typography>
                </Box>

                <Box sx={{ color: "#212121" }}>
                  <Typography><strong>Event Name:</strong> {post.event_name}</Typography>
                  <Typography><strong>Theme Name:</strong> {post.theme_name}</Typography>
                  <Typography><strong>Location:</strong> {post.municipality_name}, {post.barangay_name}</Typography>
                  <Typography><strong>Date:</strong> {dayjs(post.date).format("MM/DD/YYYY")}</Typography>
                  <Typography><strong>Start Time:</strong> {dayjs(post.start_time, "HH:mm:ss").format("hh:mm A")}</Typography>
                  <Typography><strong>End Time:</strong> {dayjs(post.end_time, "HH:mm:ss").format("hh:mm A")}</Typography>
                  <Typography><strong>Audience:</strong> {post.audience}</Typography>
                  <Typography><strong>Performer Needed:</strong> {post.performer_needed}</Typography>
                  <Typography><strong>Description:</strong> {post.description}</Typography>
                  <Typography><strong>Categories:</strong> {post.talents.join(", ")}</Typography>
                </Box>

                {/* Admin Controls */}
                {user?.role === "admin" && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleEdit(post)}
                      sx={{ mr: 2 }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(post.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                )}

                {/* Performer Controls */}
                {user?.role === "performer" && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => handleApply(post.id)}
                          disabled={post.applications?.some(
                            (app) => app.performer_id === user.performerPortfolioId
                          )}
                        >
                          {post.applications?.some(
                            (app) => app.performer_id === user.performerPortfolioId
                          )
                            ? "Applied"
                            : "Apply"}
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleMessage(post.user)}
                        >
                          Message
                        </Button>
                      </Box>
                    )}

                {/* Comment Section */}
                <Box
                    sx={{
                      maxHeight: 200, // Adjust the height as needed
                      overflowY: "auto",
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      p: 1,
                      mt: 2,
                    }}
                  >
                    {post.comments && post.comments.length > 0 ? (
                      post.comments.map((comment, index) => (
                        <Box
                          key={index}
                          sx={{
                            mb: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            backgroundColor: "#FFF9C4",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <Avatar
                              src={comment.user?.avatar || ""}
                              sx={{ bgcolor: "#2196f3", mr: 1 }}
                            />
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              fontWeight="bold"
                            >
                              {comment.user ? comment.user.name : "Unknown User"} -{" "}
                              <span style={{ fontSize: "0.8rem" }}>
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="textPrimary">
                            {comment.content}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center" }}>
                        No comments yet.
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ mt: 2 }}>
                      <TextField
                        label="Add a comment"
                        variant="outlined"
                        fullWidth
                        value={comments[post.id] || ""}
                        onChange={(e) =>
                          setComments((prevComments) => ({
                            ...prevComments,
                            [post.id]: e.target.value,
                          }))
                        }
                        sx={{
                          mb: 1,
                          backgroundColor: "white",
                        }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={!comments[post.id]?.trim()}
                      >
                        Submit Comment
                      </Button>
                    </Box>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            No posts available.
          </Typography>
        )}
      </div>
  
    </div>
    
  );

}
