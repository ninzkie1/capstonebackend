import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // For accessing passed state
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Button,
  Paper,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";

export default function ChatApplicants() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useStateContext();
  const location = useLocation(); // Access the passed state
  const { userId } = location.state || {}; // Extract the userId from state

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Fetch all applicants who can chat
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const response = await axiosClient.get("/performer/can-chat-applicants");
        if (response?.data?.status === "success") {
          setApplicants(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching applicants:", error);
      }
    };

    fetchApplicants();
  }, []);

  // Automatically select the user if userId is passed
  useEffect(() => {
    if (userId && applicants.length > 0) {
      const selected = applicants.find((applicant) => applicant.id === userId);
      if (selected) {
        handleApplicantClick(selected);
      }
    }
  }, [userId, applicants]);

  // Fetch messages for the selected applicant
  useEffect(() => {
    if (selectedApplicant) {
      const fetchMessages = async () => {
        try {
          const response = await axiosClient.get("/chats", {
            params: {
              user_id: user.id,
              contact_id: selectedApplicant.id,
            },
          });
          setMessages(response.data);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

      fetchMessages();
    }
  }, [selectedApplicant, user.id]);

  // Handle applicant selection
  const handleApplicantClick = (applicant) => {
    setSelectedApplicant(applicant);
    setMessages([]);
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (message.trim() !== "" && selectedApplicant) {
      try {
        await axiosClient.post("/chats", {
          sender_id: user.id,
          receiver_id: selectedApplicant.id,
          message,
        });
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isSmallScreen ? "column" : "row",
        height: "85vh",
      }}
    >
      {/* Applicants List */}
      <Box
        sx={{
          width: isSmallScreen ? "100%" : "30%",
          bgcolor: "primary.main",
          color: "white",
          overflowY: "auto",
          display: selectedApplicant && isSmallScreen ? "none" : "block",
          p: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          ClientPost
        </Typography>
        <List>
          {applicants.map((applicant) => (
            <ListItem
              button
              key={applicant.id}
              onClick={() => handleApplicantClick(applicant)}
            >
              <ListItemAvatar>
                <Avatar>{applicant.name?.[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={applicant.name} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Chat Area */}
      {selectedApplicant && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            p: 2,
            bgcolor: "background.paper",
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #ccc",
              pb: 2,
              mb: 2,
            }}
          >
            {isSmallScreen && (
              <IconButton onClick={() => setSelectedApplicant(null)}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h6">{selectedApplicant.name}</Typography>
          </Box>

          {/* Messages */}
          <Box
            id="chatArea"
            sx={{
              flex: 1,
              overflowY: "auto",
              bgcolor: "grey.100",
              p: 2,
              mb: 2,
              borderRadius: 2,
            }}
          >
            {messages.length === 0 ? (
              <Typography>No messages yet.</Typography>
            ) : (
              messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent:
                      msg.sender_id === user.id ? "flex-end" : "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      maxWidth: "70%",
                      bgcolor:
                        msg.sender_id === user.id ? "primary.main" : "grey.300",
                      color:
                        msg.sender_id === user.id ? "white" : "text.primary",
                    }}
                  >
                    {msg.message}
                  </Paper>
                </Box>
              ))
            )}
          </Box>

          {/* Message Input */}
          <Box sx={{ display: "flex", borderTop: "1px solid #ccc", p: 2 }}>
            <TextField
              fullWidth
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={handleSendMessage} variant="contained" sx={{ ml: 2 }}>
              Send
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
