import React, { useEffect, useState } from "react";
import axiosClient from "../axiosClient";
import { useStateContext } from "../context/contextprovider";
import {
    Modal,
    TextField,
    Button,
    Rating,
    IconButton,
    CircularProgress,
    Avatar,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import "react-toastify/dist/ReactToastify.css";
import profilePlaceholder from "../assets/logotalentos.png";

export default function Portfolio() {
    const { user } = useStateContext();
    const [performer, setPerformer] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [imageEditOpen, setImageEditOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [imageVersion, setImageVersion] = useState(0);
    const [formData, setFormData] = useState({
        event_name: "",
        theme_name: "",
        talent_name: "",
        location: "",
        description: "",
        rate: "",
        email: "",
        phone: "",
        experience: "",
        genres: "",
        performer_type: "",
    });
    const [events, setEvents] = useState([]);
    const [themes, setThemes] = useState([]);
    const [newVideos, setNewVideos] = useState([]);
    const [profileImage, setProfileImage] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        if (user && user.id) {
            axiosClient
                .get(`/performers/${user.id}/portfolio`)
                .then((response) => {
                    const { portfolio, user: userDetails, highlights, average_rating } = response.data;
                    setPerformer({
                        ...portfolio,
                        user: userDetails,
                        highlights: highlights || [],
                    });
                    setFormData({
                        event_name: portfolio.event_name || "",
                        theme_name: portfolio.theme_name || "",
                        talent_name: portfolio.talent_name || "",
                        location: portfolio.location || "",
                        description: portfolio.description || "",
                        rate: portfolio.rate || "",
                        email: userDetails.email || "",
                        phone: portfolio.phone || "",
                        experience: portfolio.experience || "",
                        genres: portfolio.genres || "",
                        performer_type: portfolio.performer_type || "",
                    });
                    setAverageRating(average_rating || 0);
                })
                .catch((error) => {
                    console.error("Error fetching portfolio:", error);
                    toast.error("Failed to load portfolio data.");
                });

            axiosClient
                .get("/events")
                .then((response) => {
                    setEvents(response.data);
                })
                .catch((error) => {
                    console.error("Error fetching events:", error);
                });
        }
    }, [user]);

    useEffect(() => {
        if (performer && performer.id) {
            axiosClient
                .get(`/performers/${performer.id}/ratings`)
                .then((response) => {
                    setReviews(response.data.ratings || []);
                })
                .catch((error) => {
                    console.error("Error fetching reviews:", error);
                    toast.error("Failed to load reviews.");
                });
        }
    }, [performer]);

    useEffect(() => {
        if (formData.event_name) {
            axiosClient
                .get(`/events/${formData.event_name}/themes`)
                .then((response) => {
                    setThemes(response.data);
                })
                .catch((error) => {
                    console.error("Error fetching themes:", error);
                });
        } else {
            setThemes([]);
        }
    }, [formData.event_name]);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleVideoChange = (e) => {
        setNewVideos(e.target.files);
    };

    const handleUploadVideos = () => {
        if (newVideos.length === 0) {
            toast.error("Please select at least one video to upload.");
            return;
        }

        setIsUploading(true);
        const form = new FormData();
        for (let i = 0; i < newVideos.length; i++) {
            form.append("highlight_videos[]", newVideos[i]);
        }

        axiosClient
            .post(`/performers/${user.id}/upload-videos`, form, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then(() => {
                toast.success("Videos uploaded successfully!");
                setIsUploadModalOpen(false);
                setIsUploading(false);
                setNewVideos([]);
                window.location.reload();
            })
            .catch((error) => {
                console.error("Error uploading videos:", error);
                toast.error("Error uploading videos.");
                setIsUploading(false);
            });
    };

    const handleDeleteVideo = (highlightId) => {
        axiosClient
            .delete(`/performers/highlights/${highlightId}`)
            .then(() => {
                toast.success("Video deleted successfully.");
                setPerformer((prev) => ({
                    ...prev,
                    highlights: prev.highlights.filter((highlight) => highlight.id !== highlightId),
                }));
            })
            .catch((error) => {
                console.error("Error deleting video:", error);
                toast.error("Failed to delete video.");
            });
    };

    const handleSavePortfolio = () => {
        const postData = {
            ...formData,
            event_name: events.find(event => event.id == formData.event_name)?.name || formData.event_name,
            theme_name: themes.find(theme => theme.id == formData.theme_name)?.name || formData.theme_name,
        };

        axiosClient
            .put(`/performers/${user.id}/portfolio`, postData)
            .then((response) => {
                setPerformer((prev) => ({
                    ...prev,
                    ...response.data.portfolio,
                }));
                setEditOpen(false);
                toast.success("Profile updated successfully!");
            })
            .catch((error) => {
                console.error("Error updating profile:", error);
                toast.error("Error updating profile.");
            });
    };

    const handleProfileImageUpdate = () => {
        if (!profileImage) {
            toast.error("Please select an image to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("image_profile", profileImage);

        axiosClient
            .post(`/performers/${user.id}/update-portfolio-image`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then(() => {
                setImageEditOpen(false);
                window.location.reload();
                axiosClient
                    .get(`/performers/${user.id}/portfolio`)
                    .then((response) => {
                        const { portfolio, user: userDetails, highlights, average_rating } = response.data;
                        setPerformer({
                            ...portfolio,
                            user: userDetails,
                            highlights: highlights || [],
                        });
                        setImageVersion((prevVersion) => prevVersion + 1);
                    })
                    .catch((error) => {
                        console.error("Error refetching portfolio:", error);
                        toast.error("Failed to refresh portfolio data.");
                    });
            })
            .catch((error) => {
                console.error("Error updating profile image:", error);
                toast.error("Error updating profile image.");
            });
    };

    if (!performer) {
        return <div className="flex justify-center items-center h-screen">
            <CircularProgress size={50} />
        </div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            <ToastContainer />
            <main className="flex-1 p-4 bg-gradient-to-r from-yellow-200 to-yellow-500 rounded-lg shadow-lg">
                <header className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Portfolio</h1>
                </header>
    
                <section>
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="relative">
                            <img
                                src={profilePlaceholder}
                                alt="Cover Photo"
                                className="w-full h-40 md:h-56 object-cover"
                            />
                            <div className="absolute bottom-0 left-4 md:left-6 transform translate-y-1/2">
                                <Avatar
                                    src={performer?.user?.image_profile
                                        ? `http://192.168.18.156:8000/storage/${performer.user.image_profile}?v=${imageVersion}`
                                        : profilePlaceholder}
                                    alt="Profile"
                                    sx={{ width: 80, height: 80, border: "4px solid white" }}
                                    className="shadow-lg md:w-[120px] md:h-[120px]"
                                />
                                <button
                                    onClick={() => setImageEditOpen(true)}
                                    className="absolute bottom-1 right-1 p-1 bg-white rounded-full shadow"
                                >
                                    <span className="material-icons">edit</span>
                                </button>
                            </div>
                        </div>
    
                        <div className="p-4 md:p-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mt-8 md:mt-10">
                                        {performer?.user?.name}
                                    </h2>
                                    <p className="text-gray-500 text-sm md:text-base">{formData.talent_name}</p>
                                </div>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => setEditOpen(true)}
                                    className="mt-4 md:mt-0 text-white shadow-md"
                                >
                                    Edit Profile
                                </Button>
                            </div>
    
                            <nav className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 text-center mt-8 border-t border-b border-gray-200 py-2 md:py-4">
                                <Button
                                    variant={activeTab === "overview" ? "text" : "outlined"}
                                    color={activeTab === "overview" ? "primary" : "inherit"}
                                    onClick={() => setActiveTab("overview")}
                                >
                                    Overview
                                </Button>
                                <Button
                                    variant={activeTab === "reviews" ? "text" : "outlined"}
                                    color={activeTab === "reviews" ? "primary" : "inherit"}
                                    onClick={() => setActiveTab("reviews")}
                                >
                                    Reviews
                                </Button>
                                <Button
                                    variant={activeTab === "media" ? "text" : "outlined"}
                                    color={activeTab === "media" ? "primary" : "inherit"}
                                    onClick={() => setActiveTab("media")}
                                >
                                    Highlights Video
                                </Button>
                            </nav>
    
                            <div className="mt-4 md:mt-6">
                                {activeTab === "overview" && (
                                    <div>
                                        <h3 className="font-semibold text-lg md:text-xl text-gray-700 mb-2 md:mb-3">
                                            About {performer?.user?.name}
                                        </h3>
                                        <p className="text-gray-600 mb-2">{formData.description}</p>
                                        <p className="text-gray-500">
                                            <strong>Address:</strong> {formData.location}
                                        </p>
                                        <p className="text-gray-500">
                                            <strong>Email:</strong> {formData.email}
                                        </p>
                                        <p className="text-gray-500">
                                            <strong>Phone:</strong> {formData.phone}
                                        </p>
                                        <p className="text-gray-500">
                                            <strong>Rate:</strong> {formData.rate} TALENTO COINS
                                        </p>
                                        <p className="text-gray-500">
                                            <strong>Experience:</strong> {formData.experience} years
                                        </p>
                                        <p className="text-gray-500">
                                            <strong>Genres:</strong> {formData.genres}
                                        </p>
                                        <p className="text-gray-500">
                                            <strong>Type:</strong> {formData.performer_type}
                                        </p>
                                        <div className="flex items-center mt-3">
                                            <Rating value={Number(averageRating)} readOnly precision={0.5} />
                                            <span className="ml-2 text-gray-600">({averageRating.toFixed(1)}/5)</span>
                                        </div>
                                    </div>
                                )}
    
                                {activeTab === "reviews" && (
                                    <div>
                                        {reviews.length > 0 ? (
                                            reviews.map((review) => (
                                                <div key={review.id} className="border-b border-gray-200 py-4">
                                                    <div className="flex items-start">
                                                        <Avatar
                                                            src={
                                                                review.user.image_profile
                                                                    ? `http://192.168.18.156:8000/storage/${review.user.image_profile}`
                                                                    : profilePlaceholder
                                                            }
                                                            alt={review.user.name}
                                                            sx={{ width: 40, height: 40 }}
                                                        />
                                                        <div className="ml-4">
                                                            <p className="font-semibold text-gray-800">{review.user.name}</p>
                                                            <Rating
                                                                value={Number(review.rating)}
                                                                readOnly
                                                                precision={0.5}
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 mt-2">{review.review}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-600">No reviews available.</p>
                                        )}
                                    </div>
                                )}
    
                                {activeTab === "media" && (
                                    <div>
                                        <h3 className="font-semibold text-lg md:text-xl text-gray-700 mb-2 md:mb-3">
                                            Photos & Videos
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {performer.highlights?.length > 0 ? (
                                                performer.highlights.map((video, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative overflow-hidden rounded-lg shadow-lg group"
                                                    >
                                                        <video
                                                            className="w-full h-40 object-cover"
                                                            controls
                                                        >
                                                            <source
                                                                src={`http://192.168.18.156:8000/storage/${video.highlight_video}`}
                                                                type="video/mp4"
                                                            />
                                                        </video>
                                                        <IconButton
                                                            color="secondary"
                                                            className="absolute top-2 right-2"
                                                            onClick={() => handleDeleteVideo(video.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-600">No videos uploaded yet.</p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => setIsUploadModalOpen(true)}
                                            variant="contained"
                                            color="primary"
                                            className="mt-4"
                                        >
                                            Upload Video
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            {/* Modals for Video Upload, Edit Profile, Update Image */}
            <Modal open={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)}>
                <div
                    className="modal-container"
                    style={{
                        margin: "auto",
                        padding: "2rem",
                        backgroundColor: "white",
                        maxWidth: "600px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        maxHeight: "90vh",
                        overflowY: "auto",
                    }}
                >
                    <h2 className="text-2xl font-bold mb-4">Upload Videos</h2>
                    <form>
                        <TextField
                            name="highlight_videos"
                            type="file"
                            inputProps={{ multiple: true }}
                            onChange={handleVideoChange}
                            margin="normal"
                            fullWidth
                        />
                        {isUploading ? (
                            <div className="flex justify-center mt-4">
                                <CircularProgress />
                            </div>
                        ) : (
                            <div className="flex justify-end mt-4">
                                <Button onClick={() => setIsUploadModalOpen(false)} className="mr-2">
                                    Cancel
                                </Button>
                                <Button onClick={handleUploadVideos} variant="contained" color="primary">
                                    Upload
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </Modal>

            <Modal open={editOpen} onClose={() => setEditOpen(false)}>
                <div
                    className="modal-container"
                    style={{
                        margin: "auto",
                        padding: "2rem",
                        backgroundColor: "white",
                        maxWidth: "600px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        maxHeight: "90vh",
                        overflowY: "auto",
                    }}
                >
                    <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
                    <form>
                        <div className="mb-4">
                            <label className="block text-gray-700">Event Name</label>
                            <select
                                name="event_name"
                                value={formData.event_name}
                                onChange={handleEditChange}
                                className="w-full px-3 py-2 border rounded"
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
                            <label className="block text-gray-700">Theme Name</label>
                            <select
                                name="theme_name"
                                value={formData.theme_name}
                                onChange={handleEditChange}
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="">Select Theme</option>
                                {themes.map((theme) => (
                                    <option key={theme.id} value={theme.id}>
                                        {theme.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <TextField
                            label="Talent Category"
                            name="talent_name"
                            value={formData.talent_name}
                            onChange={handleEditChange}
                            fullWidth
                            margin="normal"
                        />

                        <TextField
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleEditChange}
                            fullWidth
                            margin="normal"
                        />

                        <TextField
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleEditChange}
                            fullWidth
                            margin="normal"
                            multiline
                            rows={4}
                        />
                        <TextField
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleEditChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Phone"
                            name="phone"
                            type="text"
                            value={formData.phone}
                            onChange={handleEditChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Rate"
                            name="rate"
                            type="number"
                            value={formData.rate}
                            onChange={handleEditChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Experience (years)"
                            name="experience"
                            type="number"
                            value={formData.experience}
                            onChange={handleEditChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Genres"
                            name="genres"
                            value={formData.genres}
                            onChange={handleEditChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            name="performer_type"
                            value={formData.performer_type}
                            onChange={handleEditChange}
                            fullWidth
                            margin="normal"
                            select
                            SelectProps={{
                                native: true,
                            }}
                        >
                            <option value="">Select Performer Type</option>
                            <option value="solo">Solo</option>
                            <option value="duo">Duo</option>
                            <option value="group">Group</option>
                        </TextField>

                        <div className="flex justify-end mt-4">
                            <Button onClick={() => setEditOpen(false)} className="mr-2">
                                Cancel
                            </Button>
                            <Button onClick={handleSavePortfolio} variant="contained" color="primary">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal open={imageEditOpen} onClose={() => setImageEditOpen(false)}>
                <div
                    className="modal-container"
                    style={{
                        margin: "auto",
                        padding: "2rem",
                        backgroundColor: "white",
                        maxWidth: "600px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        maxHeight: "90vh",
                        overflowY: "auto",
                    }}
                >
                    <h2 className="text-2xl font-bold mb-4">Update Profile Image</h2>
                    <form>
                        <TextField
                            label="Upload Profile Image"
                            name="image_profile"
                            type="file"
                            onChange={(e) => setProfileImage(e.target.files[0])}
                            margin="normal"
                        />
                        <div className="flex justify-end mt-4">
                            <Button onClick={() => setImageEditOpen(false)} className="mr-2">
                                Cancel
                            </Button>
                            <Button onClick={handleProfileImageUpdate} variant="contained" color="primary">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
