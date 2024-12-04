import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Menu, MenuItem, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { useStateContext } from "../context/contextprovider";
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  PostAdd as PostIcon,
  AccountCircle as ProfileIcon,
  AccountBalanceWallet as WalletIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import MessageIcon from '@mui/icons-material/Message';
import logo from "../assets/logotalentos.png";

export default function CustomerLayout() {
  const { token, setToken, setUser } = useStateContext();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width:768px)");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    navigate("/login");
    handleMenuClose();
  };

  const handleMessages = () => {
    navigate("/messages");
    handleMenuClose();
  };

  const handleEditProfile = () => {
    navigate("/customer-profile");
    handleMenuClose();
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerOpen(open);
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <div
      className="flex flex-col min-h-screen bg-cover bg-center bg-yellow-500 relative overflow-hidden"
      style={{
        backgroundImage: "url('/confetti.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
     

      {/* Header */}
      <AppBar position="fixed" className="!bg-gradient-to-r from-yellow-500 to-yellow-700 shadow-none top-0 left-0 w-full z-50">
        <Toolbar className="flex justify-between">
          <Typography variant="h6" component="div" className="flex items-center">
            <img src={logo} alt="Logo" className="h-12 mr-2 animate-bounce" />
            <span className="text-gray-100 font-extrabold font-serif">TALENTO</span>
          </Typography>
          {isMobile ? (
            // Menu button for mobile
            <IconButton edge="end" color="inherit" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
          ) : (
            // Full navigation menu for larger screens
            <div className="flex space-x-4 text-gray-100">
              <Button color="inherit" href="/" className="text-gray-100 hover:text-blue-700 transition-colors duration-300" startIcon={<HomeIcon />}>
                Home
              </Button>
              <Button color="inherit" href="/dashboard" className="text-gray-100 hover:text-blue-700 transition-colors duration-300" startIcon={<DashboardIcon />}>
                Dashboard
              </Button>
              <Button color="inherit" href="/posts" className="text-gray-100 hover:text-blue-700 transition-colors duration-300" startIcon={<PostIcon />}>
                Post
              </Button>
              <Button color="inherit" href="/wallet" className="text-gray-100 hover:text-blue-700 transition-colors duration-300" startIcon={<WalletIcon />}>
                Wallet
              </Button>
              <Button
                color="inherit"
                className="text-gray-100 hover:text-blue-700 transition-colors duration-300"
                startIcon={<ProfileIcon />}
                onClick={handleProfileMenuOpen}
              >
                Profile
              </Button>
            </div>
          )}
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        keepMounted
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        open={isMenuOpen}
        onClose={handleMenuClose}
        MenuListProps={{ style: { backgroundColor: "#FFEB3B", padding: "10px" } }}
      >
        <MenuItem onClick={handleEditProfile} className="hover:bg-yellow-400 transition-colors duration-300">
          <ProfileIcon className="mr-2 text-blue-900" />
          View Profile
        </MenuItem>
        <MenuItem onClick={handleMessages} className="hover:bg-yellow-400 transition-colors duration-300">
          <MessageIcon className="mr-2 text-blue-900" />
          Messages
        </MenuItem>
        <MenuItem onClick={handleLogout} className="hover:bg-yellow-400 transition-colors duration-300">
          <LogoutIcon className="mr-2 text-blue-900" />
          Logout
        </MenuItem>
      </Menu>

                {/* Mobile Drawer */}
                <Drawer
              anchor="right"
              open={drawerOpen}
              onClose={toggleDrawer(false)}
              sx={{
                '& .MuiDrawer-paper': {
                  width: isMobile ? '40%' : 250,
                  height: '100vh', // Set height to full viewport height
                  boxSizing: 'border-box',
                  backgroundColor: '#f59e0b', // Consistent yellow color
                  color: '#FFFFFF', // Set text color for readability
                },
              }}
            >
              <List sx={{ height: '100%', padding: 0 }}>
                <ListItem button onClick={() => navigate("/")} sx={{ color: '#FFFFFF' }}>
                  <ListItemIcon>
                    <HomeIcon style={{ color: '#FFFFFF' }} />
                  </ListItemIcon>
                  <ListItemText primary="Home" />
                </ListItem>
                <ListItem button onClick={() => navigate("/dashboard")} sx={{ color: '#FFFFFF' }}>
                  <ListItemIcon>
                    <DashboardIcon style={{ color: '#FFFFFF' }} />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button onClick={() => navigate("/posts")} sx={{ color: '#FFFFFF' }}>
                  <ListItemIcon>
                    <PostIcon style={{ color: '#FFFFFF' }} />
                  </ListItemIcon>
                  <ListItemText primary="Post" />
                </ListItem>
                <ListItem button onClick={() => navigate("/wallet")} sx={{ color: '#FFFFFF' }}>
                  <ListItemIcon>
                    <WalletIcon style={{ color: '#FFFFFF' }} />
                  </ListItemIcon>
                  <ListItemText primary="Wallet" />
                </ListItem>
                <ListItem button onClick={handleEditProfile} sx={{ color: '#FFFFFF' }}>
                  <ListItemIcon>
                    <ProfileIcon style={{ color: '#FFFFFF' }} />
                  </ListItemIcon>
                  <ListItemText primary="View Profile" />
                </ListItem>
                <ListItem button onClick={() => navigate("/messages")} sx={{ color: '#FFFFFF' }}>
                  <ListItemIcon>
                    <MessageIcon style={{ color: '#FFFFFF' }} />
                  </ListItemIcon>
                  <ListItemText primary="Messages" />
                </ListItem>
                <ListItem button onClick={handleLogout} sx={{ color: '#FFFFFF' }}>
                  <ListItemIcon>
                    <LogoutIcon style={{ color: '#FFFFFF' }} />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItem>
              </List>
            </Drawer>


      {/* Main Content */}
      <main className="flex-1 bg-transparent px-0 py-0 mt-28">
        <Outlet />
      </main>
    </div>
  );
}
