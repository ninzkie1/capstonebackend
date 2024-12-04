import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import {
  Box,
  Avatar,
  Button,
  TextField,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useStateContext } from "../context/contextprovider";
import echo from "../echo";

export default function ChatApplicants() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));

  const { user } = useStateContext(); // Get the logged-in user
  const [message, setMessage] = useState(""); // Current message input
  const [messages, setMessages] = useState([]); // Chat messages
  const [applicants, setApplicants] = useState([]); // Contact list for applicants
  const [selectedApplicant, setSelectedApplicant] = useState(null); // Selected contact
  const [isChatOpen, setIsChatOpen] = useState(false); // Toggle chat window
  const [isSending, setIsSending] = useState(false); // Sending state

  // Fetch applicants who can chat
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const response = await axiosClient.get("/performer/can-chat-applicants");
        if (response?.data?.status === "success") {
          setApplicants(response.data.data);
        } else {
          console.error("Unexpected response for applicants:", response);
        }
      } catch (error) {
        console.error("Error fetching applicants:", error);
      }
    };

    fetchApplicants();
  }, []);

  // Fetch messages for selected applicant
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedApplicant) {
        try {
          const response = await axiosClient.get("/chats", {
            params: {
              user_id: user.id,
              contact_id: selectedApplicant.id,
            },
          });
          setMessages(response.data || []);
        } catch (error) {
          console.error("Error fetching messages:", error);
          setMessages([]);
        }

        // Real-time message updates
        echo.channel("chat-channel").listen(".message.sent", (e) => {
          const newMessage = e.chat;
          setMessages((prev) =>
            prev.some((msg) => msg.id === newMessage.id)
              ? prev
              : [...prev, newMessage]
          );
        });

        return () => {
          echo.leaveChannel("chat-channel");
        };
      }
    };

    fetchMessages();
  }, [selectedApplicant, user.id]);

  // Send message
  const handleSendMessage = async () => {
    if (message.trim() && selectedApplicant) {
      setIsSending(true);
      try {
        await axiosClient.post("/chats", {
          sender_id: user.id,
          receiver_id: selectedApplicant.id,
          message,
        });
        setMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setIsSending(false);
      }
    }
  };

  // Handle applicant selection
  const handleSelectApplicant = (applicant) => {
    setMessages([]);
    setSelectedApplicant(applicant);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    const chatArea = document.getElementById("chatArea");
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }, [messages]);

  // Handle back button for small screen
  const handleBackToApplicants = () => setSelectedApplicant(null);

  return (
    <div>
      {/* Chat Toggle Button */}
      <IconButton
        onClick={() => setIsChatOpen((prev) => !prev)}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          bgcolor: "blue",
          color: "white",
          boxShadow: "0px 0px 10px rgba(0,0,0,0.3)",
          "&:hover": { bgcolor: "darkblue" },
        }}
      >
        <ChatIcon />
      </IconButton>

      {/* Chat Window */}
      {isChatOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 70,
            right: 16,
            width: isSmallScreen ? "90%" : isMediumScreen ? "70%" : "400px",
            height: isSmallScreen ? "70vh" : "500px",
            bgcolor: "white",
            boxShadow: 24,
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: "blue",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {selectedApplicant ? (
              <>
                <IconButton onClick={handleBackToApplicants} sx={{ color: "white" }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">{selectedApplicant.name}</Typography>
              </>
            ) : (
              <Typography variant="h6">Applicants</Typography>
            )}
            <IconButton sx={{ color: "white" }} onClick={() => setIsChatOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Applicant List or Messages */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {selectedApplicant ? (
              <div id="chatArea" style={{ maxHeight: "100%", overflowY: "auto" }}>
                {messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        mb: 2,
                        justifyContent:
                          msg.sender_id === user.id ? "flex-end" : "flex-start",
                      }}
                    >
                      {msg.sender_id !== user.id && (
                        <Avatar>{selectedApplicant.name?.[0] || "U"}</Avatar>
                      )}
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "8px",
                          bgcolor:
                            msg.sender_id === user.id ? "#e0f7fa" : "#f1f1f1",
                        }}
                      >
                        <Typography>{msg.message}</Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography>No messages yet.</Typography>
                )}
              </div>
            ) : (
              <List>
                {applicants.length > 0 ? (
                  applicants.map((applicant) => (
                    <ListItem
                      key={applicant.id}
                      button
                      onClick={() => handleSelectApplicant(applicant)}
                    >
                      <ListItemAvatar>
                        <Avatar>{applicant.name?.[0] || "U"}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={applicant.name || "Unknown"} />
                    </ListItem>
                  ))
                ) : (
                  <Typography>No applicants available.</Typography>
                )}
              </List>
            )}
          </Box>

          {/* Message Input */}
          {selectedApplicant && (
            <Box
              sx={{ display: "flex", p: 2, borderTop: "1px solid #ccc" }}
            >
              <TextField
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
                disabled={isSending}
              />
              <Button
                onClick={handleSendMessage}
                variant="contained"
                color="primary"
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send"}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </div>
  );
}
