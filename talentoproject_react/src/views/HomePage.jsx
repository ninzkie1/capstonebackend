import { Link, useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import axiosClient from '../axiosClient';
import Logo from "../assets/logotalentos.png";
import Footer from '../components/Footer';
import { useStateContext } from "../context/contextprovider";
import Rating from '@mui/material/Rating';
import { VolumeUp, VolumeOff } from '@mui/icons-material';
import profile from '../assets/Ilk.jpg';

export default function HomePage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPerformer, setSelectedPerformer] = useState(null);
    const [performers, setPerformers] = useState([]);
    const [isMuted, setIsMuted] = useState([]);
    const aboutUsRef = useRef(null);
    const featuredPerformerRef = useRef(null);
    const highlightsRef = useRef(null);
    const { user } = useStateContext();
    const navigate = useNavigate();

    useEffect(() => {
<<<<<<< HEAD
        axiosClient.get('http://127.0.0.1:8000/api/performer')
=======
        axiosClient
            .get("http://192.168.1.25:8000/api/performer")
>>>>>>> 2efd938beefb56725a50997f037da9dad0979a42
            .then((response) => {
                setPerformers(response.data);
                setIsMuted(response.data.map(() => true));
            })
            .catch((error) => {
                console.error('Error fetching performers:', error);
            });

        if (user) {
            if (user.role === 'admin') {
                navigate('/managepost');
            } else if (user.role === 'customer') {
                navigate('/customer');
            } else if (user.role === 'performer') {
                navigate('/post');
            }
        }
    }, [user, navigate]);

    const handleAboutUs = () => {
        navigate('/aboutus');
    };

    const handleSeeDetails = (performer) => {
        setSelectedPerformer(performer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPerformer(null);
    };

    const handleSeePortfolio = () => {
        navigate('/login');
    };

    const toggleMute = (index) => {
        setIsMuted((prevMuted) => {
            const newMutedState = [...prevMuted];
            newMutedState[index] = !newMutedState[index];
            return newMutedState;
        });
    };

    return (
        <div className="flex flex-col min-h-screen">
            <nav className="sticky top-0 bg-yellow-700 text-white shadow-md z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <img
                                src={Logo}
                                alt="Talento Logo"
                                className="h-10 w-auto mr-2"
                            />
                            <a href="/home"><h1 className="text-xl font-bold sm:text-2xl">Talento</h1></a>
                        </div>
                        <div className="hidden sm:flex sm:items-center space-x-6 ml-auto">
                            <Link
                                to="/login"
                                className="hover:text-indigo-400 transition-colors duration-300 font-medium"
                            >
                                Login
                            </Link>
                            <button
                                onClick={() => handleAboutUs()}
                                className="hover:text-indigo-400 transition-colors duration-300 font-medium"
                            >
                                About Us
                            </button>
                        </div>
                        <div className="sm:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-yellow-800"
                            >
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="sm:hidden bg-yellow-600">
                        <Link
                            to="/login"
                            className="block px-4 py-2 hover:bg-yellow-700 text-white"
                        >
                            Login
                        </Link>
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                scrollToSection(aboutUsRef);
                            }}
                            className="block px-4 py-2 hover:bg-yellow-700 text-white"
                        >
                            About Us
                        </button>
                    </div>
                )}
            </nav>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-yellow-700 relative overflow-hidden" style={{ backgroundImage: "url('/confetti.png')", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "cover" }}>
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="text-center mb-12 z-10">
                    <h2 className="text-4xl font-extrabold text-white mb-4 animate-bounce">
                        Welcome to Talento
                    </h2>
                    <p className="text-lg text-gray-200 mb-6">
                        Discover and book talented performers for your events. Browse through our selection of artists and find the perfect fit for your next occasion.
                    </p>
                    <Link
                        to="/register"
                        className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-white px-6 py-3 rounded-full text-lg font-semibold hover:scale-105 transition-transform duration-300 shadow-lg"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Highlights Section */}
                <section ref={highlightsRef} className="w-full bg-yellow-600 py-16 px-4">
                    <div className="max-w-7xl mx-auto text-center">
                        <h3 className="text-3xl font-semibold text-white mb-4">Highlights</h3>
                        <p className="text-lg text-gray-200 mb-6">
                            Discover the best moments from our top talents and watch them in action.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {performers.map((performer, index) => (
                                performer.performer_portfolio?.highlights?.length > 0 && (
                                    <div key={index} className="relative group overflow-hidden rounded-lg shadow-lg">
                                        <video
                                            className="w-full h-48 object-cover group-hover:scale-110 group-hover:opacity-80 transition-transform duration-500"
<<<<<<< HEAD
                                            src={`http://127.0.0.1:8000/storage/${performer.performer_portfolio.highlights[0].highlight_video}`}
=======
                                            src={`http://192.168.1.25:8000/storage/${performer.performer_portfolio.highlights[0].highlight_video}`}
>>>>>>> 2efd938beefb56725a50997f037da9dad0979a42
                                            autoPlay
                                            loop
                                            muted={isMuted[index]}
                                            playsInline
                                        />
                                        <button
                                            className="absolute bottom-4 right-4 bg-black bg-opacity-50 rounded-full p-2 text-white"
                                            onClick={() => toggleMute(index)}
                                        >
                                            {isMuted[index] ? <VolumeOff /> : <VolumeUp />}
                                        </button>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                </section>

                {/* Featured Performers Section */}
                <section ref={featuredPerformerRef} className="w-full bg-yellow-700 py-16 px-4">
                    <div className="max-w-7xl mx-auto text-center">
                        <h3 className="text-3xl font-semibold text-white mb-4">
                            Featured Performers
                        </h3>
                        <p className="text-lg text-gray-200 mb-6">
                            Meet our top performers and see why they are the best choice for your events.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
<<<<<<< HEAD
                            {performers.map((performer, index) => (
                                <div
                                    key={index}
                                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md transition-transform transform hover:scale-105 hover:shadow-xl"
                                >
                                    <img
                                        src={performer.image_profile ? `http://127.0.0.1:8000/storage/${performer.image_profile}` : profile}
                                        alt={performer.name}
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold mb-2 text-yellow-700">{performer.name}</h3>
                                        <p className="text-gray-600 font-semibold"><label>Talent:</label> {performer.performer_portfolio?.talent_name}</p>
                                        <p className="text-gray-600 font-semibold"><label>Location:</label> {performer.performer_portfolio?.location}</p>
                                        <div className="flex items-center mt-2">
                                            <span className="mr-2 font-semibold text-yellow-700">Rating:</span> 
                                            <Rating
                                                value={performer.performer_portfolio?.average_rating || 4.0}
                                                precision={0.5}
                                                readOnly
                                            />
=======
                            {performers
                                .filter(
                                    (performer) =>
                                        performer.image_profile &&
                                        performer.performer_portfolio?.talent_name
                                )
                                .map((performer, index) => (
                                    <div
                                        key={index}
                                        className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md transition-transform transform hover:scale-105 hover:shadow-xl"
                                    >
                                        <img
                                            src={`http://192.168.1.25:8000/storage/${performer.image_profile}`}
                                            alt={performer.name}
                                            className="w-full h-40 object-cover"
                                        />
                                        <div className="p-4">
                                            <h3 className="text-lg font-semibold mb-2 text-yellow-700">
                                                {performer.name}
                                            </h3>
                                            <p className="text-gray-600 font-semibold">
                                                <label>Talent:</label>{" "}
                                                {performer.performer_portfolio?.talent_name}
                                            </p>
                                            <p className="text-gray-600 font-semibold">
                                                <label>Location:</label>{" "}
                                                {performer.performer_portfolio?.location}
                                            </p>
                                            <div className="flex items-center mt-2">
                                                <span className="mr-2 font-semibold text-yellow-700">
                                                    Rating:
                                                </span>
                                                <Rating
                                                    value={
                                                        performer.performer_portfolio
                                                            ?.average_rating || 4.0
                                                    }
                                                    precision={0.5}
                                                    readOnly
                                                />
                                            </div>
                                            <button
                                                className="mt-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full shadow hover:scale-105 transition-transform duration-300"
                                                onClick={() => handleSeeDetails(performer)}
                                            >
                                                See Details
                                            </button>
>>>>>>> 2efd938beefb56725a50997f037da9dad0979a42
                                        </div>
                                        <button
                                            className="mt-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full shadow hover:scale-105 transition-transform duration-300"
                                            onClick={() => handleSeeDetails(performer)}
                                        >
                                            See Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* About Us Section */}
                <section ref={aboutUsRef} className="w-full bg-yellow-600 py-16 px-4">
                    <div className="max-w-7xl mx-auto text-center">
                        <h3 className="text-3xl font-semibold text-white mb-4">
                            About Us
                        </h3>
                        <p className="text-lg text-gray-200 mb-6">
                            At Talent Booking, we connect you with exceptional performers.
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}