import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import axiosClient from "../axiosClient";
import dayjs from "dayjs"; // Import day.js
import utc from "dayjs/plugin/utc"; // Import UTC plugin
import timezone from "dayjs/plugin/timezone"; // Import Timezone plugin

// Extend dayjs to use the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Set timezone to Asia/Manila
const timezoneName = "Asia/Manila";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function PerformerBooking() {
  const { isSidebarOpen } = useOutletContext();
  const [summary, setSummary] = useState({
    total_users: [],
    users_created_today: [],
    total_bookings: [],
    bookings_today: [],
    cancelled_bookings: [],
    approved_bookings: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch summary data from the API using axiosClient
    axiosClient
      .get("/admin/summary-report")
      .then((response) => {
        if (response.data.status === "success") {
          setSummary(response.data.data);
        }
      })
      .catch((error) => console.error("Error fetching summary data:", error))
      .finally(() => setLoading(false));
  }, []);

  // Generate labels for the last 30 days (from today in Asia/Manila)
  const labels = Array.from({ length: 30 }, (_, i) => {
    return dayjs()
      .tz(timezoneName)
      .subtract(29 - i, "day")
      .format("MMM D");
  });

  // Chart options
  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        offset: false,
      },
      y: {
        beginAtZero: true,
        grace: "10%",
        ticks: {
          stepSize: 1,
          callback: function (value) {
            if (Number.isInteger(value)) {
              return value;
            }
          },
        },
      },
    },
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading data...</div>;
  }

  if (!summary) {
    return (
      <div className="text-center text-red-600">
        Error loading data. Please try again.
      </div>
    );
  }

  // Generate chart data using the summary values
  const generateChartData = (label, data, backgroundColor) => ({
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor,
      },
    ],
  });

  // Data for each chart
  const totalUsersData = generateChartData(
    "Total Users",
    summary.total_users,
    "rgba(54, 162, 235, 0.6)"
  );

  const usersCreatedTodayData = generateChartData(
    "Users Created Today",
    summary.users_created_today,
    "rgba(255, 99, 132, 0.6)"
  );

  const totalBookingsData = generateChartData(
    "Total Bookings",
    summary.total_bookings,
    "rgba(75, 192, 192, 0.6)"
  );

  const bookingsTodayData = generateChartData(
    "Bookings Created Today",
    summary.bookings_today,
    "rgba(255, 206, 86, 0.6)"
  );

  const cancelledBookingsData = generateChartData(
    "Cancelled Bookings",
    summary.cancelled_bookings,
    "rgba(255, 159, 64, 0.6)"
  );

  const approvedBookingsData = generateChartData(
    "Approved Bookings",
    summary.approved_bookings,
    "rgba(153, 102, 255, 0.6)"
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <main className="flex-1 w-full">
        <div className="px-4 py-6 sm:px-6 lg:px-8 grid grid-cols-1 gap-16">
          {/* Metrics Summary Cards */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Total Users</h2>
            <p className="text-gray-600 text-4xl">
              {summary.total_users[summary.total_users.length - 1]}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Users Created Today</h2>
            <p className="text-gray-600 text-4xl">
              {summary.users_created_today[summary.users_created_today.length - 1]}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Total Bookings</h2>
            <p className="text-gray-600 text-4xl">
              {summary.total_bookings[summary.total_bookings.length - 1]}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Bookings Created Today</h2>
            <p className="text-gray-600 text-4xl">
              {summary.bookings_today[summary.bookings_today.length - 1]}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Cancelled Bookings</h2>
            <p className="text-gray-600 text-4xl">
              {summary.cancelled_bookings[summary.cancelled_bookings.length - 1]}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Approved Bookings</h2>
            <p className="text-gray-600 text-4xl">
              {summary.approved_bookings[summary.approved_bookings.length - 1]}
            </p>
          </div>

          {/* Bar Charts for Trends */}
          <div className="bg-white shadow rounded-lg p-6 h-96 mb-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Total Users Trend (Last 30 Days)
            </h2>
            <Bar data={totalUsersData} options={chartOptions} />
          </div>
          <div className="bg-white shadow rounded-lg p-6 h-96 mb-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Users Created Today Trend (Last 30 Days)
            </h2>
            <Bar data={usersCreatedTodayData} options={chartOptions} />
          </div>
          <div className="bg-white shadow rounded-lg p-6 h-96 mb-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Total Bookings Trend (Last 30 Days)
            </h2>
            <Bar data={totalBookingsData} options={chartOptions} />
          </div>
          <div className="bg-white shadow rounded-lg p-6 h-96 mb-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Bookings Created Today Trend (Last 30 Days)
            </h2>
            <Bar data={bookingsTodayData} options={chartOptions} />
          </div>
          <div className="bg-white shadow rounded-lg p-6 h-96 mb-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Cancelled Bookings Trend (Last 30 Days)
            </h2>
            <Bar data={cancelledBookingsData} options={chartOptions} />
          </div>
          <div className="bg-white shadow rounded-lg p-6 h-96 mb-16">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Approved Bookings Trend (Last 30 Days)
            </h2>
            <Bar data={approvedBookingsData} options={chartOptions} />
          </div>
        </div>
      </main>
    </div>
  );
}
