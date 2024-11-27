import React, { useEffect, useState } from "react";
import axios from "../axiosClient";
import dayjs from "dayjs";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ChatCustomer from "./ChatCustomer";


export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get("/transactions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setTransactions(response.data.data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions.");
      }
    };

    fetchTransactions();
  }, []);

  const handleApprove = async (transactionId) => {
    try {
      const response = await axios.put(
        `/transactions/${transactionId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success("Transaction approved.");
        fetchTransactions();  // Re-fetch the transactions after approval
      } else {
        toast.error("Failed to approve transaction. Unexpected response.");
      }
    } catch (error) {
      console.error("Error approving transaction:", error.response || error);
      toast.error(
        error.response?.data?.error || "Failed to approve transaction."
      );
    }
  };

  const handleDecline = async (transactionId) => {
    try {
      const response = await axios.put(
        `/transactions/${transactionId}/decline`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success("Transaction declined.");
        fetchTransactions();  // Re-fetch the transactions after decline
      } else {
        toast.error("Failed to decline transaction. Unexpected response.");
      }
    } catch (error) {
      console.error("Error declining transaction:", error.response || error);
      toast.error(
        error.response?.data?.error || "Failed to decline transaction."
      );
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get("/transactions", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTransactions(response.data.data);  // Update transactions with latest data
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative bg-cover bg-center" style={{ backgroundImage: "url('/talent.png')" }}>
      <ToastContainer />
      <div className="absolute inset-0 bg-black opacity-50"></div>
      {/* Top-Centered Title */}
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <h2 className="text-4xl font-extrabold text-white mb-4">
          Dashboard
        </h2>
      </div>
    <main className="absolute top-4 left-0 right-0 flex justify-center max-w-7xl mx-auto z-10 mt-12">
    <Box
          sx={{
            backgroundColor: "#f59e0b",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "30px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            width: "100%",
          }}
        >
      <ToastContainer />
      <Typography
            variant="h6"
            align="center"
            sx={{
              fontWeight: 600,
              color: "white",
              mb: 2,
            }}
          >
        Talent Applicants
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: "10px", overflow: "hidden" }}>
        <Table stickyHeader>
        {!isMobile && (
          <TableHead>
            <TableRow sx={{ backgroundColor: "#fcd34d" }}>
              <TableCell>Performer Name</TableCell>
              <TableCell>Type of Talent</TableCell>
              <TableCell>Event</TableCell>
              <TableCell>Rate</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
        )}
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transactions.id}>
                  <TableCell>{transactions.performer_name || "Performer Name"}</TableCell>
                  <TableCell>{transactions.performer_talent}</TableCell>
                  <TableCell>₱{parseFloat(transactions.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    {dayjs(transactions.start_date).isValid()
                      ? dayjs(transactions.start_date).format("MMMM D, YYYY")
                      : "Invalid Date"}
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        backgroundColor:
                          transactions.status === "PENDING"
                            ? "#FBBF24"
                            : transactions.status === "APPROVED"
                            ? "#22C55E"
                            : transactions.status === "DECLINED"
                            ? "#EF4444"
                            : "#AAAAAA",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "0.8em",
                      }}
                    >
                      {transactions.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transactions.transaction_type === "Booking Received" && transactions.status === "PENDING" ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Box
                          sx={{
                            backgroundColor: "#D1E7DD",
                            padding: "4px",
                            borderRadius: "8px",
                            display: "inline-flex",
                          }}
                        >
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApprove(transaction.id)}
                            sx={{ backgroundColor: "transparent", color: "#155724" }}
                          >
                            Approve
                          </Button>
                        </Box>
                        <Box
                          sx={{
                            backgroundColor: "#F8D7DA",
                            padding: "4px",
                            borderRadius: "8px",
                            display: "inline-flex",
                          }}
                        >
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDecline(transaction.id)}
                            sx={{ backgroundColor: "transparent", color: "#721C24" }}
                          >
                            Decline
                          </Button>
                        </Box>
                      </Box>
                    ) : transaction.status === "PENDING" ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ marginRight: 1 }}>
                          Processing
                        </Typography>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      "Completed"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No applicants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
            <br/> <br />
      <Typography
            variant="h6"
            align="center"
            sx={{
              fontWeight: 600,
              color: "white",
              mb: 2,
            }}
          >
        Transaction History
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: "10px", overflow: "hidden" }}>
        <Table stickyHeader>
        {!isMobile && (
          <TableHead>
            <TableRow sx={{ backgroundColor: "#fcd34d" }}>
              <TableCell>Performer</TableCell>
              <TableCell>Transaction Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date of Booking</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
        )}
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.performer_name || "Performer Name"}</TableCell>
                  <TableCell>{transaction.transaction_type}</TableCell>
                  <TableCell>₱{parseFloat(transaction.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    {dayjs(transaction.start_date).isValid()
                      ? dayjs(transaction.start_date).format("MMMM D, YYYY")
                      : "Invalid Date"}
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        backgroundColor:
                          transaction.status === "PENDING"
                            ? "#FBBF24"
                            : transaction.status === "APPROVED"
                            ? "#22C55E"
                            : transaction.status === "DECLINED"
                            ? "#EF4444"
                            : "#AAAAAA",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "0.8em",
                      }}
                    >
                      {transaction.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transaction.transaction_type === "Booking Received" && transaction.status === "PENDING" ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Box
                          sx={{
                            backgroundColor: "#D1E7DD",
                            padding: "4px",
                            borderRadius: "8px",
                            display: "inline-flex",
                          }}
                        >
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => handleApprove(transaction.id)}
                            sx={{ backgroundColor: "transparent", color: "#155724" }}
                          >
                            Approve
                          </Button>
                        </Box>
                        <Box
                          sx={{
                            backgroundColor: "#F8D7DA",
                            padding: "4px",
                            borderRadius: "8px",
                            display: "inline-flex",
                          }}
                        >
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => handleDecline(transaction.id)}
                            sx={{ backgroundColor: "transparent", color: "#721C24" }}
                          >
                            Decline
                          </Button>
                        </Box>
                      </Box>
                    ) : transaction.status === "PENDING" ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ marginRight: 1 }}>
                          Processing
                        </Typography>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      "Completed"
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    </main>
    </div>
  );
}
