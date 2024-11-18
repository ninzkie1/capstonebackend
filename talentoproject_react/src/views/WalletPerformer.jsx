import React, { useState, useEffect } from "react";
import { useStateContext } from "../context/contextprovider";
import axiosClient from "../axiosClient";
import {
  Box,
  Button,
  Typography,
  Modal,
  TextField,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Styles for modal
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 700,
  bgcolor: "background.paper",
  borderRadius: "12px",
  boxShadow: 24,
  p: 4,
};

export default function WalletPerformer() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [adminWallet, setAdminWallet] = useState(null);
  const [loadingAdminWallet, setLoadingAdminWallet] = useState(true);
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptInfo, setReceiptInfo] = useState({
    amount: "",
    referenceNumber: "",
  });
  const [withdrawInfo, setWithdrawInfo] = useState({
    accountName: "",
    accountNumber: "",
    amount: "",
    qrCode: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState(null);
  const [requestHistory, setRequestHistory] = useState([]);
  const { user } = useStateContext();

  // Fetch admin wallet details
  const fetchAdminWallet = async () => {
    setLoadingAdminWallet(true);
    try {
      const response = await axiosClient.get("/wallet-info");
      if (response.status === 200 && response.data.status === "success") {
        setAdminWallet(response.data.wallet);
      } else {
        alert("Admin Wallet is under Maintenance");
      }
    } catch (error) {
      console.error("Error fetching admin wallet:", error);
      alert("Admin Wallet is under Maintenance.");
    } finally {
      setLoadingAdminWallet(false);
    }
  };

  // Fetch user Talento Coin balance
  const fetchUserBalance = async () => {
    try {
      const response = await axiosClient.get("/talento_coin_balance");
      if (response.status === 200 && response.data.status === "success") {
        setUserBalance(response.data.balance);
      } else {
        alert("Failed to fetch Talento Coin balance. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching Talento Coin balance:", error);
      alert("Failed to fetch Talento Coin balance. Please try again later.");
    }
  };

  // Fetch request history for the logged-in user
  const fetchRequestHistory = async () => {
    try {
      const response = await axiosClient.get("/user-request-history");
      if (response.status === 200 && response.data.status === "success") {
        setRequestHistory(response.data.data);
      } else {
        alert("Failed to fetch request history. Please try again later.");
      }
    } catch (error) {
      console.error("Error fetching request history:", error);
      alert("Failed to fetch request history. Please try again later.");
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAdminWallet();
      fetchUserBalance();
      fetchRequestHistory();
    }
  }, [user?.id]);

  // Show deposit modal
  const handleDepositClick = () => {
    setShowDepositModal(true);
  };

  // Show withdraw modal
  const handleWithdrawClick = () => {
    setShowWithdrawModal(true);
  };

  // Handle receipt image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setReceiptImage(file);
  };

  // Handle withdrawal QR code upload
  const handleQRCodeUpload = (e) => {
    const file = e.target.files[0];
    setWithdrawInfo((prevInfo) => ({
      ...prevInfo,
      qrCode: file,
    }));
  };

  // Handle receipt information change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReceiptInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  // Handle withdraw information change
  const handleWithdrawInputChange = (e) => {
    const { name, value } = e.target;
    setWithdrawInfo((prevInfo) => ({
      ...prevInfo,
      [name]: value,
    }));
  };

  // Handle form submission to process the deposit
  const handleProcessClick = async () => {
    if (!receiptImage || !receiptInfo.amount || !receiptInfo.referenceNumber) {
      alert("Please complete all the fields before processing.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("amount", receiptInfo.amount);
    formData.append("reference_number", receiptInfo.referenceNumber);
    formData.append("receipt", receiptImage);

    try {
      const response = await axiosClient.post("/deposit-request", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        toast.success("Receipt has been sent for processing. Please wait for admin approval.");
        setShowDepositModal(false);
        setReceiptInfo({ amount: "", referenceNumber: "" });
        setReceiptImage(null);
        fetchUserBalance(); // Update balance immediately
        fetchRequestHistory();
      } else {
        alert("Failed to submit deposit. Please try again.");
      }
    } catch (error) {
      console.error("Error processing deposit:", error);
      alert("Failed to submit deposit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submission to process the withdrawal
  const handleWithdrawProcessClick = async () => {
    if (!withdrawInfo.qrCode || !withdrawInfo.accountName || !withdrawInfo.accountNumber || !withdrawInfo.amount) {
      alert("Please complete all the fields before processing.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("account_name", withdrawInfo.accountName);
    formData.append("account_number", withdrawInfo.accountNumber);
    formData.append("amount", withdrawInfo.amount);
    formData.append("qr_code", withdrawInfo.qrCode);

    try {
      const response = await axiosClient.post("/withdraw-request", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        toast.success("Withdraw request has been submitted successfully. Please wait for admin approval.");
        setShowWithdrawModal(false);
        setWithdrawInfo({ accountName: "", accountNumber: "", amount: "", qrCode: null });
        fetchUserBalance(); // Update balance immediately
        fetchRequestHistory();
      } else {
        alert("Failed to submit withdrawal request. Please try again.");
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("Failed to submit withdrawal request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto rounded-lg shadow-md relative overflow-hidden"
      sx={{
        backgroundImage: "url('/confetti.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        position: "relative",
      }}
    >
      {/* Background overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1,
        }}
      />

      <Box className="wallet-client" sx={{ textAlign: "center", zIndex: 2 }}>
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            color: "#fff",
            fontWeight: "bold",
            fontFamily: "serif",
            fontSize: "1.5rem",
          }}
        >
          Available Talento Coin:
        </Typography>
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            color="#ffcc00"
            sx={{ fontWeight: "bold", fontFamily: "serif", fontSize: "2.5rem" }}
          >
            {userBalance !== null ? userBalance : "Loading..."}
          </Typography>
          <img
            src="/talentocoin.png"
            alt="Talento Coin"
            style={{
              width: "48px",
              height: "48px",
              verticalAlign: "middle",
              marginLeft: "8px",
            }}
          />
        </Box>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#ffcc00",
            color: "#000",
            fontWeight: "bold",
            mr: 2,
            borderRadius: "20px",
            "&:hover": { backgroundColor: "#e6b800" },
          }}
          onClick={handleDepositClick}
          startIcon={<AddCircleIcon />}
        >
          Deposit
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#6a0dad",
            color: "#fff",
            fontWeight: "bold",
            borderRadius: "20px",
            "&:hover": { backgroundColor: "#5a0bb2" },
          }}
          onClick={handleWithdrawClick}
          startIcon={<RemoveCircleIcon />}
        >
          Withdraw
        </Button>

        {/* Request History Section */}
        <Box
          sx={{
            mt: 5,
            p: 3,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "12px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            sx={{
              mb: 3,
              color: "#333",
              fontWeight: "bold",
            }}
          >
            Request History
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: "#f4f4f9" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>User Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Balance Before</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Balance After</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Reference Number</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requestHistory.length > 0 ? (
                  requestHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.user?.name || user?.name}</TableCell>
                      <TableCell>{record.balance_before}</TableCell>
                      <TableCell>{record.balance_after}</TableCell>
                      <TableCell>{record.amount}</TableCell>
                      <TableCell>{record.reference_number}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            bgcolor:
                              record.status === "APPROVED" ? "green" : "red",
                            color: "#fff",
                            py: "3px",
                            px: "8px",
                            borderRadius: "12px",
                            textAlign: "center",
                          }}
                        >
                          {record.status}
                        </Box>
                      </TableCell>
                      <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No request history found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {/* Modal for Deposit */}
      <Modal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        aria-labelledby="deposit-modal-title"
        aria-describedby="deposit-modal-description"
      >
        <Box sx={modalStyle}>
          {/* Modal Content for Deposit */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography id="deposit-modal-title" variant="h6" component="h2">
              Deposit Talento Coin
              </Typography>
            <IconButton onClick={() => setShowDepositModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {loadingAdminWallet ? (
            <Box display="flex" justifyContent="center" alignItems="center" mb={3}>
              <CircularProgress />
            </Box>
          ) : (
            adminWallet && (
              <Box display="flex" alignItems="flex-start" mb={3}>
                {/* QR Code Image on the Left Side */}
                <Box
                  sx={{
                    width: "40%",
                    mr: 3,
                  }}
                >
                  {adminWallet.qr_code_url ? (
                    <img
                      src={adminWallet.qr_code_url}
                      alt="Admin GCash QR"
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No QR code available.
                    </Typography>
                  )}
                </Box>

                {/* Admin GCash Information & Input Fields on the Right Side */}
                <Box sx={{ width: "60%" }}>
                  <Box mb={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Admin GCash Information:
                    </Typography>
                    <Typography variant="body2">
                      Account Name: {adminWallet.account_name}
                    </Typography>
                    <Typography variant="body2">
                      Account Number: {adminWallet.account_number}
                    </Typography>
                  </Box>

                  {/* Form Fields for Upload Receipt, Amount Sent, Reference Number */}
                  <Box mb={3}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Upload Receipt
                      <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                    </Button>
                    {receiptImage && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {receiptImage.name}
                      </Typography>
                    )}
                  </Box>

                  <Box mb={3}>
                    <TextField
                      fullWidth
                      label="Amount Sent"
                      name="amount"
                      value={receiptInfo.amount}
                      onChange={handleInputChange}
                      variant="outlined"
                      type="number"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Reference Number"
                      name="referenceNumber"
                      value={receiptInfo.referenceNumber}
                      onChange={handleInputChange}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
            )
          )}

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              onClick={handleProcessClick}
              variant="contained"
              color="success"
              sx={{ mr: 2 }}
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} />}
            >
              {isSubmitting ? "Processing..." : "Process"}
            </Button>
            <Button onClick={() => setShowDepositModal(false)} variant="outlined" color="inherit">
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal for Withdraw */}
      <Modal
        open={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        aria-labelledby="withdraw-modal-title"
        aria-describedby="withdraw-modal-description"
      >
        <Box sx={modalStyle}>
          {/* Modal Content for Withdraw */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography id="withdraw-modal-title" variant="h6" component="h2">
              Withdraw Talento Coin
            </Typography>
            <IconButton onClick={() => setShowWithdrawModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box mb={3}>
            <TextField
              fullWidth
              label="Account Name"
              name="accountName"
              value={withdrawInfo.accountName}
              onChange={handleWithdrawInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Account Number"
              name="accountNumber"
              value={withdrawInfo.accountNumber}
              onChange={handleWithdrawInputChange}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              value={withdrawInfo.amount}
              onChange={handleWithdrawInputChange}
              variant="outlined"
              type="number"
              sx={{ mb: 2 }}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Upload QR Code
              <input type="file" accept="image/*" hidden onChange={handleQRCodeUpload} />
            </Button>
            {withdrawInfo.qrCode && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {withdrawInfo.qrCode.name}
              </Typography>
            )}
          </Box>

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              onClick={handleWithdrawProcessClick}
              variant="contained"
              color="success"
              sx={{ mr: 2 }}
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} />}
            >
              {isSubmitting ? "Processing..." : "Process"}
            </Button>
            <Button onClick={() => setShowWithdrawModal(false)} variant="outlined" color="inherit">
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      <ToastContainer />
    </Box>
  );
}
