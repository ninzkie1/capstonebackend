import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import Rating from "@mui/material/Rating";
import { VolumeUp, VolumeOff, MusicNote } from "@mui/icons-material";
import { Badge } from "@mui/material";
import profile from "../assets/Ilk.jpg";
import ChatCustomer from "./ChatCustomer";

export default function Customer() {
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isFilteredModalOpen, setIsFilteredModalOpen] = useState(false);
    const [isMusicNoteModalOpen, setIsMusicNoteModalOpen] = useState(false);
    const [filteredPerformers, setFilteredPerformers] = useState([]);
    const [isMuted, setIsMuted] = useState([]);
    const [performers, setPerformers] = useState([]);
    const [events, setEvents] = useState([]);
    const [themes, setThemes] = useState([]);
    const [formData, setFormData] = useState({
        event_id: "",
        theme_id: "",
    });
    const [selectedPerformers, setSelectedPerformers] = useState([]);

    const { user } = useStateContext();
    const navigate = useNavigate();
    const highlightsRef = useRef(null);

    useEffect(() => {
        axiosClient
            .get("/performervid")
            .then((response) => {
                if (response.data.status === "success") {
                    const validPerformers = response.data.data.filter(
                        (performer) =>
                            performer.image_profile &&
                            performer.performer_portfolio?.rate
                    );
                    const sortedPerformers = validPerformers.sort(
                        (a, b) =>
                            (b.performer_portfolio?.average_rating || 0) -
                            (a.performer_portfolio?.average_rating || 0)
                    );
                    setPerformers(sortedPerformers);
                    setIsMuted(validPerformers.map(() => true));
                }
            })
            .catch((error) => {
                console.error("Error fetching performers:", error);
            });

        axiosClient
            .get("/events")
            .then((response) => {
                setEvents(response.data);
            })
            .catch((error) => console.error("Error fetching events:", error));

        if (user) {
            if (user.role === "admin") {
                navigate("/managepost");
            } else if (user.role === "client") {
                navigate("/customer");
            } else if (user.role === "performer") {
                navigate("/post");
            }
        }
    }, [user, navigate]);

    const handleSeeDetails = (performer) => {
        navigate(`/portfolio/${performer.performer_portfolio.id}`);
    };

    const toggleMute = (index) => {
        setIsMuted((prevMuted) =>
            prevMuted.map((mute, i) => (i === index ? !mute : mute))
        );
    };

    const handleBookNowClick = () => setIsBookingModalOpen(true);
    const handleBookingFormClose = () => setIsBookingModalOpen(false);

    const handleEventChange = (e) => {
        const eventId = e.target.value;
        setFormData({ ...formData, event_id: eventId, theme_id: "" });

        axiosClient
            .get(`/events/${eventId}/themes`)
            .then((response) => {
                setThemes(response.data);
            })
            .catch((error) => console.error("Error fetching themes:", error));
    };

    const handleThemeChange = (e) => {
        setFormData({ ...formData, theme_id: e.target.value });
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        const { event_id, theme_id } = formData;

        if (event_id && theme_id) {
            try {
                const response = await axiosClient.get("/filter-performers", {
                    params: { event_id, theme_id },
                });
                const validFilteredPerformers = response.data.filter(
                    (performer) =>
                        performer.image_profile &&
                        performer.performer_portfolio?.rate
                );
                setFilteredPerformers(validFilteredPerformers);
                setIsFilteredModalOpen(true); // Opens the modal with filtered performers
            } catch (error) {
                console.error("Error fetching filtered performers:", error);
            }
        }
        setIsBookingModalOpen(false);
    };
    const handleBookAllPerformers = () => {
        navigate("/addBook", {
            state: { performers: selectedPerformers },
        });
    };

    const handleFilteredModalClose = () => setIsFilteredModalOpen(false);

    const handleAddToBooking = (performer) => {
        setSelectedPerformers((prevSelected) => {
            if (!prevSelected.find((p) => p.id === performer.id)) {
                return [...prevSelected, performer];
            }
            return prevSelected;
        });
    };

    const handleBookPerformer = (performer) => {
        navigate("/addBook", {
            state: { performers: [performer] }, // Wrap the performer in an array
        });
    };

    // Updated function to show the MusicNote modal only if there are performers selected
    const handleMusicNoteModalToggle = () => {
        if (selectedPerformers.length > 0) {
            setIsMusicNoteModalOpen(true);
        }
    };

    const handleMusicNoteModalClose = () => setIsMusicNoteModalOpen(false);

    return (
        <div className="flex flex-col min-h-screen relative">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <main
                className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-7xl mx-auto bg-cover bg-center relative overflow-hidden rounded-lg shadow-md"
                style={{ backgroundImage: "url('/talent.png')" }}
            >
                <div className="text-center mb-12 z-10">
                    <h2 className="text-4xl font-extrabold text-white mb-4 animate-bounce">
                        Welcome to Talento
                    </h2>
                    <p className="text-lg text-gray-200 mb-6">
                        Discover and book talented performers for your events. Browse through our selection of artists and find the perfect fit for your next occasion.
                    </p>
                    <button
                        onClick={handleBookNowClick}
                        className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-6 py-3 rounded-full text-lg font-semibold hover:from-indigo-700 hover:to-indigo-600 transition-transform duration-300 shadow-lg transform hover:scale-105"
                    >
                        Find Recommendations!
                    </button>
                </div>

                <section ref={highlightsRef} className="w-full bg-yellow-600 py-16 px-4 z-10">
                    <div className="max-w-7xl mx-auto text-center">
                        <h3 className="text-3xl font-semibold text-white mb-4">Performers</h3>
                        <p className="text-lg text-gray-200 mb-6">
                            Discover the best moments from our top talents and watch them in action.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {performers.map((performer, index) => (
                                <div key={index} className="relative group overflow-hidden rounded-lg shadow-lg transition-all duration-500 hover:shadow-2xl bg-white border border-gray-200">
                                    {performer.performer_portfolio?.highlights?.[0]?.highlight_video ? (
                                        <div className="relative">
                                            <video
                                                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                                src={`http://192.168.18.156:8000/storage/${performer.performer_portfolio.highlights[0].highlight_video}`}
                                                autoPlay
                                                loop
                                                muted={isMuted[index]}
                                                playsInline
                                            />
                                            <button
                                                className="absolute bottom-4 right-4 bg-black bg-opacity-60 rounded-full p-3 text-white transition-transform duration-300 hover:scale-110"
                                                onClick={() => toggleMute(index)}
                                            >
                                                {isMuted[index] ? <VolumeOff /> : <VolumeUp />}
                                            </button>
                                            <img
                                                src={performer.image_profile ? `http://192.168.18.156:8000/storage/${performer.image_profile}` : profile}
                                                alt={performer.name}
                                                className="absolute -bottom-6 left-4 w-16 h-16 rounded-full border-4 border-white object-cover transform translate-y-1/2"
                                            />
                                        </div>
                                    ) : (
                                        <img
                                            src={performer.image_profile ? `http://192.168.18.156:8000/storage/${performer.image_profile}` : profile}
                                            alt={performer.name}
                                            className="w-full h-48 object-cover"
                                        />
                                    )}
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold mb-1">{performer.name} {performer.lastname}</h3>
                                        <p className="text-base font-semibold mb-1 text-left">
                                            <label>Talent:</label> {performer.performer_portfolio?.talent_name}
                                        </p>
                                        <p className="text-base font-semibold mb-1 text-left">
                                            <label>Location:</label> {performer.performer_portfolio?.location}
                                        </p>
                                        <p className="text-base font-semibold mb-1 text-left">
                                            <label>Talent:</label> {performer.performer_portfolio?.talent_name}
                                        </p>
                                        <p className="text-base font-semibold mb-1 text-left">
                                            <label>Rate Per Booking:</label> {performer.performer_portfolio?.rate} TCoins
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <span className="mr-2 font-semibold">Rating:</span>
                                            <Rating
                                                value={performer.performer_portfolio?.average_rating || 0.0}
                                                precision={0.5}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-wrap justify-center gap-2">
                                        <button
                                            className="bg-blue-500 text-white px-3 py-2 rounded-md shadow hover:bg-blue-400 transition-colors duration-300 w-full md:w-auto"
                                            onClick={() => handleSeeDetails(performer)}
                                        >
                                            See Details
                                        </button>
                                        <button
                                            className="bg-green-500 text-white px-3 py-2 rounded-md shadow hover:bg-green-400 transition-colors duration-300 w-full md:w-auto"
                                            onClick={() => handleBookPerformer(performer)}
                                        >
                                            Book
                                        </button>
                                        <button
                                            className="bg-yellow-500 text-white px-3 py-2 rounded-md shadow hover:bg-yellow-400 transition-colors duration-300 w-full md:w-auto"
                                            onClick={() => handleAddToBooking(performer)}
                                        >
                                            Add to Booking
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Booking Modal */}
{isBookingModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
        <div className="bg-white p-4 sm:p-8 rounded-lg shadow-2xl w-full max-w-lg mx-auto">
            <h3 className="text-2xl font-semibold mb-4 text-center">
                Find Recommendations
            </h3>
            <form onSubmit={handleBookingSubmit}>
                <div className="mb-4">
                    <label
                        htmlFor="event_name"
                        className="block text-gray-800 font-semibold mb-2"
                    >
                        Event Name
                    </label>
                    <select
                        id="event_name"
                        name="event_id"
                        value={formData.event_id}
                        onChange={handleEventChange}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        required
                    >
                        <option value="">Select Event</option>
                        {events.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label
                        htmlFor="theme_name"
                        className="block text-gray-800 font-semibold mb-2"
                    >
                        Theme Name
                    </label>
                    <select
                        id="theme_name"
                        name="theme_id"
                        value={formData.theme_id}
                        onChange={handleThemeChange}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        required
                        disabled={!formData.event_id}
                    >
                        <option value="">Select Theme</option>
                        {themes.map((theme) => (
                            <option key={theme.id} value={theme.id}>
                                {theme.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4">
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-5 py-3 rounded-full shadow hover:from-indigo-700 hover:to-indigo-600 transition-transform duration-300 transform hover:scale-105"
                    >
                        Find Performers
                    </button>
                    <button
                        type="button"
                        className="bg-gray-600 text-white px-5 py-3 rounded-full shadow hover:bg-gray-500 transition-transform duration-300 transform hover:scale-105"
                        onClick={handleBookingFormClose}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
)}

{/* Filtered Performers Modal */}
{isFilteredModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-4xl h-full mx-auto overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">
                Available Performers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPerformers.length > 0 ? (
                    filteredPerformers.map((performer, index) => (
                        <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md"
                        >
                            <img
                                src={`http://192.168.18.156:8000/storage/${performer.image_profile}`}
                                alt={performer.name}
                                className="w-full h-40 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-2">
                                    {performer.name}
                                </h3>
                                <p className="text-gray-600 font-semibold">
                                    <label>Talent:</label>{" "}
                                    {performer.performer_portfolio?.talent_name}
                                </p>
                                <p className="text-gray-600 font-semibold">
                                    <label>Rate per Booking:</label>{" "}
                                    {performer.performer_portfolio?.rate} TCoins
                                </p>
                                <p className="text-gray-600 font-semibold">
                                    <label>Location:</label>{" "}
                                    {performer.performer_portfolio?.location}
                                </p>
                                <div className="flex items-center mt-2">
                                    <span className="mr-2 font-semibold">
                                        Rating:
                                    </span>
                                    <Rating
                                        value={performer.performer_portfolio?.average_rating || 0.0}
                                        precision={0.5}
                                        readOnly
                                    />
                                </div>
                                <button
                                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-400 transition-colors duration-300 w-full"
                                    onClick={() => handleSeeDetails(performer)}
                                >
                                    See Details
                                </button>
                                <button
                                    className="mt-4 ml-0 bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-400 transition-colors duration-300 w-full"
                                    onClick={() => handleBookPerformer(performer)}
                                >
                                    Book
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-600">
                        No performers available for the selected event and theme.
                    </p>
                )}
            </div>
            <div className="flex justify-end mt-4">
                <button
                    className="bg-gray-600 text-white px-4 py-2 rounded-md shadow hover:bg-gray-500 transition-colors duration-300"
                    onClick={handleFilteredModalClose}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

{/* Selected Performers Modal */}
{isMusicNoteModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-4xl h-full mx-auto overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-center">
                Selected Performers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedPerformers.length > 0 ? (
                    selectedPerformers.map((performer, index) => (
                        <div
                            key={index}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md"
                        >
                            <img
                                src={`http://192.168.18.156:8000/storage/${performer.image_profile}`}
                                alt={performer.name}
                                className="w-full h-40 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-2">
                                    {performer.name}
                                </h3>
                                <p className="text-gray-600 font-semibold">
                                    <label>Talent:</label>{" "}
                                    {performer.performer_portfolio?.talent_name}
                                </p>
                                <p className="text-gray-600 font-semibold">
                                    <label>Rate per Booking:</label>{" "}
                                    {performer.performer_portfolio?.rate} TCoins
                                </p>
                                <p className="text-gray-600 font-semibold">
                                    <label>Location:</label>{" "}
                                    {performer.performer_portfolio?.location}
                                </p>
                                <div className="flex items-center mt-2">
                                    <span className="mr-2 font-semibold">
                                        Rating:
                                    </span>
                                    <Rating
                                        value={performer.performer_portfolio?.average_rating || 0.0}
                                        precision={0.5}
                                        readOnly
                                    />
                                </div>
                                <button
                                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-400 transition-colors duration-300 w-full"
                                    onClick={() => handleSeeDetails(performer)}
                                >
                                    See Details
                                </button>
                                <button
                                    className="mt-4 ml-0 bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-400 transition-colors duration-300 w-full"
                                    onClick={() => handleBookPerformer(performer)}
                                >
                                    Book
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-600">
                        No performers have been selected for booking.
                    </p>
                )}
            </div>
            <div className="flex flex-col sm:flex-row justify-between mt-4 gap-4">
                <button
                    className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-400 transition-transform duration-300 transform hover:scale-105"
                    onClick={() => handleBookAllPerformers()}
                >
                    Book All
                </button>
                <button
                    className="bg-gray-600 text-white px-4 py-2 rounded-md shadow hover:bg-gray-500 transition-colors duration-300"
                    onClick={handleMusicNoteModalClose}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}
            </main>

            {/* MusicNote Icon for Booking List */}
            <div className="fixed bottom-6 left-6 z-50">
                <Badge
                    badgeContent={selectedPerformers.length}
                    color="primary"
                    onClick={handleMusicNoteModalToggle}
                >
                    <MusicNote
                        fontSize="large"
                        style={{ cursor: "pointer", color: "#1976d2" }}
                    />
                </Badge>
            </div>

            <div className="fixed bottom-6 right-6 z-50">
                <ChatCustomer />
            </div>
        </div>
    );
}
