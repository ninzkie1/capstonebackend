import React, { useState, useEffect } from "react";
import Logo from "../assets/logotalentos.png";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  IconButton,
  Toolbar,
  AppBar,
  Avatar,
  useMediaQuery,
  Drawer,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as PowerIcon,
  Campaign as CampaignIcon,
  AccountBalanceWallet as WalletIcon,
  Chat as ChatBubbleIcon,
  AccountCircle as UserCircleIcon,
  Dashboard as DashboardIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";

export default function PerformerLayout() {
  const { user, token, setToken, setUser } = useStateContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [performer, setPerformer] = useState(null);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/post":
        return "Urgent Hiring";
      case "/portfolio":
        return "Portfolio";
      case "/chat":
        return "Messages";
      case "/booking":
        return "Dashboard";
      case "/performer-wallet":
        return "Performer Wallet";
      default:
        return "Performer Dashboard";
    }
  };

  useEffect(() => {
    if (user) {
      fetchPerformerData();
    }
  }, [user]);

  const fetchPerformerData = () => {
    if (user) {
      axiosClient
        .get(`/performers/${user.id}/portfolio`)
        .then((response) => setPerformer(response.data))
        .catch((error) => console.error("Error fetching performer data:", error));
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const onLogout = (ev) => {
    ev.preventDefault();
    setToken(null);
    setUser(null);
    localStorage.removeItem("USER_DATA");
  };

  const navigateTo = (route) => navigate(route);

  if (!token) {
    return <Navigate to="/login" />;
  }

  const SidebarContent = () => (
    <>
      <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
        <Avatar
          src={
            performer?.user?.image_profile
              ? `http://192.168.254.116:8000/storage/${performer.user.image_profile}`
              : Logo
          }
          alt="Profile Image"
          sx={{
            width: 70,
            height: 70,
            marginRight: 2,
            border: "2px solid #fff",
          }}
        />
        <Box sx={{ color: "white" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: "1.2rem" }}>
            Welcome
          </Typography>
          {user && (
            <>
              <Typography sx={{ fontSize: "1rem" }}>{user.role}</Typography>
              <Typography sx={{ fontSize: "1rem" }}>{user.name}</Typography>
            </>
          )}
        </Box>
        {isSmallScreen && (
          <IconButton onClick={toggleSidebar} sx={{ color: "white", ml: "auto" }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <List sx={{ p: 2 }}>
        {[
          { text: "Urgent Hiring", icon: <CampaignIcon />, route: "/post" },
          { text: "Portfolio", icon: <UserCircleIcon />, route: "/portfolio" },
          { text: "Messages", icon: <ChatBubbleIcon />, route: "/chat" },
          { text: "Dashboard", icon: <DashboardIcon />, route: "/booking" },
          { text: "Wallet", icon: <WalletIcon />, route: "/performer-wallet" },
          { text: "Log Out", icon: <PowerIcon />, action: onLogout },
        ].map((item, index) => (
          <ListItem
            button
            key={index}
            onClick={item.route ? () => navigateTo(item.route) : item.action}
            sx={{
              paddingY: 3,
              paddingX: 2.5,
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
              },
              borderRadius: "4px",
              marginBottom: "2px",
              transition: "background-color 0.3s ease",
            }}
          >
            <ListItemIcon
              sx={{
                color: "white",
                minWidth: "32px",
                "& > *": {
                  fontSize: "1.2rem",
                },
              }}
            >
              {item.icon}
            </ListItemIcon>
            <Typography
              variant="body1"
              sx={{ color: "white", fontWeight: "bold", fontSize: "0.9rem" }}
            >
              {item.text}
            </Typography>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar for top navigation with gradient background */}
      <AppBar
        position="fixed"
        sx={{
          backgroundImage: "linear-gradient(to right, #D97706, #F59E0B)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <IconButton edge="start" color="inherit" onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: "center" }}>
            {getPageTitle()}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar with gradient background */}
      {isSmallScreen ? (
        <Drawer
          anchor="left"
          open={isSidebarOpen}
          onClose={toggleSidebar}
          sx={{
            "& .MuiDrawer-paper": {
              backgroundImage: "linear-gradient(to right, #D97706, #F59E0B)",
              color: "#fff",
              width: 250,
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      ) : (
        <Box
          sx={{
            width: isSidebarOpen ? 250 : 0,
            transition: "width 0.3s ease",
            overflow: "hidden",
            backgroundImage: "linear-gradient(to right, #D97706, #F59E0B)",
            color: "#fff",
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            paddingTop: "64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <SidebarContent />
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: isSidebarOpen && !isSmallScreen ? "250px" : 0,
          transition: "margin-left 0.3s ease",
          padding: 3,
        }}
      >
        <Toolbar />
        <Outlet context={{ isSidebarOpen, fetchPerformerData }} />
      </Box>
    </Box>
  );
}
