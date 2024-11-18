import React from "react";
import { useOutletContext } from "react-router-dom";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function PerformerBooking() {
  const { isSidebarOpen } = useOutletContext();

  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Performances Booked',
        data: [5, 8, 6, 10, 12, 15, 9, 11, 14, 16, 18, 20],
        fill: false,
        backgroundColor: 'rgba(153,102,255,0.2)',
        borderColor: 'rgba(153,102,255,1)',
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="container mx-auto p-6">
      <header className="bg-gray-800 shadow w-full">
        <div className="flex justify-center items-center px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Reporting Management
          </h1>
        </div>
      </header>
      <main className="flex-1 w-full">
        <div className="px-4 py-6 sm:px-6 lg:px-8 grid grid-cols-2 gap-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Total Bookings</h2>
            <p className="text-gray-600 text-4xl">56</p>
            <p className="text-gray-600">+8.25% Since last month</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Total Commision</h2>
            <p className="text-gray-600 text-4xl">₱45,000</p>
            <p className="text-gray-600">4.15% Increase Since Last Month</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">New Users</h2>
            <p className="text-gray-600 text-4xl">12</p>
            <p className="text-gray-600">+5 Today</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800">Cancelled Booking</h2>
            <p className="text-gray-600 text-4xl">3</p>
            <p className="text-gray-600">-3 Since Last Month</p>
          </div>
          <div className="col-span-2 bg-white shadow rounded-lg p-6 h-96">
            <h2 className="text-2xl font-semibold text-gray-800">Performance Trends</h2>
            <Line data={data} options={options} />
          </div>
        </div>
      </main>
    </div>
  );
}
