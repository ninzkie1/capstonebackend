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

export default function ChatCustomer() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));

  const { user } = useStateContext(); // Get the logged-in user
  const [message, setMessage] = useState(""); // Current message input
  const [isInputDisabled, setIsInputDisabled] = useState(false); // To temporarily disable input
  const [messages, setMessages] = useState([]); // Chat messages
  const [contacts, setContacts] = useState([]); // Contact list
  const [selectedUser, setSelectedUser] = useState(null); // Selected contact
  const [isChatOpen, setIsChatOpen] = useState(false); // Toggle chat window
  const [isContactSelected, setIsContactSelected] = useState(false); // Contact/chat toggle
  const [isSending, setIsSending] = useState(false); // Sending state
  const [tempError, setTempError] = useState(""); // Temporary error message

  // Fetch contacts based on user role
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const [performerResponse, adminResponse] = await Promise.all([
          axiosClient.get("/canChatPerformer"),
          axiosClient.get("/getAdmin"),
        ]);

        let performers = [];
        let admins = [];

        if (
          performerResponse?.data?.status === "success" &&
          Array.isArray(performerResponse.data.data)
        ) {
          performers = performerResponse.data.data;
        }

        if (Array.isArray(adminResponse.data)) {
          admins = adminResponse.data;
        }

        // Combine performers and admins
        setContacts([...performers, ...admins]);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setContacts([]);
      }
    };

    fetchContacts();
  }, [user.role]);

  // Fetch messages for the selected user
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUser) {
        try {
          const response = await axiosClient.get("/chats", {
            params: {
              user_id: user.id,
              contact_id: selectedUser.id,
            },
          });
          setMessages(response.data || []);
        } catch (error) {
          console.error("Error fetching messages:", error);
          setMessages([]);
        }

        echo.channel("chat-channel").listen(".message.sent", (e) => {
          const newMessage = e.chat;
          setMessages((prev) => {
            if (!prev.some((msg) => msg.id === newMessage.id)) {
              return [...prev, newMessage];
            }
            return prev;
          });
        });

        return () => {
          echo.leaveChannel("chat-channel");
        };
      }
    };

    fetchMessages();
  }, [selectedUser, user.id]);

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim()) {
      // Show the error in the chatbox temporarily
      setTempError("Message cannot be empty");
      setIsInputDisabled(true); // Disable input temporarily
      setTimeout(() => {
        setTempError(""); // Clear the error after 2 seconds
        setIsInputDisabled(false); // Re-enable input
      }, 2000);
      return; // Stop further execution
    }

    setIsSending(true);
    try {
      await axiosClient.post("/chats", {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message,
      });
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender_id: user.id, message }, // Add the sent message to the chatbox
      ]);
      setMessage(""); // Clear input after sending
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle user selection
  const handleUserClick = (contact) => {
    setMessages([]);
    setSelectedUser(contact);
    setIsContactSelected(true);
  };

  // Back to contacts
  const handleBackToContacts = () => setIsContactSelected(false);

  // Auto-scroll
  useEffect(() => {
    const chatArea = document.getElementById("chatArea");
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }, [messages]);

  return (
    <div>
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
            {isContactSelected ? (
              <>
                <IconButton
                  onClick={handleBackToContacts}
                  sx={{ color: "white" }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">{selectedUser.name}</Typography>
              </>
            ) : (
              <Typography variant="h6">Contacts</Typography>
            )}
            <IconButton
              sx={{ color: "white" }}
              onClick={() => setIsChatOpen(false)}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {!isContactSelected ? (
              contacts.length > 0 ? (
                <List>
                  {contacts.map((contact) => (
                    <ListItem
                      key={contact.id}
                      button
                      onClick={() => handleUserClick(contact)}
                    >
                      <ListItemAvatar>
                        <Avatar>{contact.name?.[0] || "U"}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={contact.name || "Unknown"} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No contacts available.</Typography>
              )
            ) : (
              <div id="chatArea" style={{ maxHeight: "100%", overflowY: "auto" }}>
                {/* Render the temporary error */}
                {tempError && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "red",
                        fontStyle: "italic",
                      }}
                    >
                      {tempError}
                    </Typography>
                  </Box>
                )}

                {/* Render the chat messages */}
                {messages.map((msg, index) => (
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
                      <Avatar>{selectedUser.name?.[0] || "U"}</Avatar>
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
                ))}
              </div>
            )}
          </Box>

          {isContactSelected && (
            <Box sx={{ display: "flex", p: 2, borderTop: "1px solid #ccc" }}>
              <TextField
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
                disabled={isInputDisabled || isSending} // Disable input when error or sending
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
