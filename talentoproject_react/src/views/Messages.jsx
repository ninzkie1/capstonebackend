import React, { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import { useOutletContext } from "react-router-dom";
import { useStateContext } from "../context/contextprovider";
import echo from "../echo";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  AppBar,
  Toolbar,
  Button,
  TextField,
  useMediaQuery,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTheme } from "@mui/material/styles";

export default function Messages() {
  const { isSidebarOpen } = useOutletContext();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const { user } = useStateContext();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch contacts (clients and admins)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Fetch both clients and admins concurrently
        const [clientsResponse, adminsResponse] = await Promise.all([
          axiosClient.get("/canChatClients"),
          axiosClient.get("/getAdmin"),
          
        ]);

        let clients = [];
        let admins = [];
        

        // Extract clients data
        if (clientsResponse?.data?.status === "success" && Array.isArray(clientsResponse.data.data)) {
          clients = clientsResponse.data.data;
        } else {
          console.error("Unexpected clients response format:", clientsResponse);
        }

        // Extract admins data
        if (Array.isArray(adminsResponse?.data)) {
          admins = adminsResponse.data.map((admin) => ({
            ...admin,
            isAdmin: true, // Add a flag to distinguish admins
          }));
        } else {
          console.error("Unexpected admins response format:", adminsResponse);
        }

        // Combine clients and admins
        setContacts([...clients, ...admins]);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setContacts([]);
      }
    };

    fetchContacts();
  }, [user.id]);

  // Fetch messages for the selected contact
  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        try {
          const response = await axiosClient.get("/chats", {
            params: {
              user_id: user.id,
              contact_id: selectedUser.id,
            },
          });
          setMessages(response.data);

          // Real-time message listener
          echo.channel("chat-channel").listen(".message.sent", (e) => {
            const newMessage = e.chat;
            if (
              (newMessage.sender_id === user.id && newMessage.receiver_id === selectedUser.id) ||
              (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === user.id)
            ) {
              setMessages((prevMessages) => {
                if (!prevMessages.some((msg) => msg.id === newMessage.id)) {
                  return [...prevMessages, newMessage];
                }
                return prevMessages;
              });
            }
          });

          return () => {
            echo.leaveChannel("chat-channel");
          };
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      };

      fetchMessages();
    }
  }, [selectedUser, user.id]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (message.trim() !== "" && selectedUser) {
      const newMessage = {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message,
      };

      setMessage("");

      try {
        await axiosClient.post("/chats", newMessage);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  // Handle user selection from contacts list
  const handleUserClick = (contact) => {
    setSelectedUser(contact);
    setMessages([]);
  };

  // Scroll chat area to bottom on new messages
  useEffect(() => {
    const chatArea = document.getElementById("chatArea");
    if (chatArea) {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }, [messages]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isSmallScreen ? "column" : "row",
        height: "85vh",
        bgcolor: "background.default",
      }}
    >
      {/* Contact List */}
      <Box
        sx={{
          width: isSmallScreen ? "100%" : "30%",
          backgroundColor: "#1976d2",
          color: "#fff",
          overflowY: "auto",
          display: selectedUser && isSmallScreen ? "none" : "block",
          p: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Contacts
        </Typography>
        <List>
          {contacts.length > 0 ? (
            contacts.map((contact, index) => (
              <ListItem
                button
                key={index}
                onClick={() => handleUserClick(contact)}
              >
                <ListItemAvatar>
                  <Avatar src={`https://i.pravatar.cc/40?img=${index}`} />
                </ListItemAvatar>
                <ListItemText
                  primary={contact.name || "Unknown"}
                  secondary={contact.isAdmin ? "Admin" : "Client"}
                />
              </ListItem>
            ))
          ) : (
            <Typography sx={{ p: 2 }}>No contacts available to chat.</Typography>
          )}
        </List>
      </Box>

      {/* Chat Area */}
      {selectedUser && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            bgcolor: "background.paper",
            p: 2,
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #ccc",
              paddingBottom: 2,
              mb: 2,
            }}
          >
            {isSmallScreen && (
              <IconButton onClick={() => setSelectedUser(null)} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight="bold">
              {selectedUser.name}
            </Typography>
          </Box>

          {/* Chat Messages */}
          <Box
            id="chatArea"
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              bgcolor: "grey.100",
              borderRadius: 2,
              mb: 2,
            }}
          >
            {messages.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No messages yet.
              </Typography>
            ) : (
              messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent: msg.sender_id === user.id ? "flex-end" : "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      maxWidth: "70%",
                      borderRadius: 2,
                      bgcolor: msg.sender_id === user.id ? "primary.main" : "background.paper",
                      color: msg.sender_id === user.id ? "#fff" : "text.primary",
                    }}
                  >
                    <Typography variant="body1">{msg.message}</Typography>
                  </Paper>
                </Box>
              ))
            )}
          </Box>

          {/* Message Input */}
          <Box
            sx={{
              display: "flex",
              p: 2,
              borderTop: "1px solid #ccc",
              alignItems: "center",
              bgcolor: "grey.200",
            }}
          >
            <TextField
              variant="outlined"
              placeholder="Type something here..."
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              sx={{
                mr: 2,
                bgcolor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "grey.400",
                  },
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
              sx={{ height: "100%", bgcolor: "primary.main" }}
            >
              Send
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
