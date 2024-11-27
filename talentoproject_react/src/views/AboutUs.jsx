import { useRef } from 'react';
import Logo from "../assets/logotalentos.png";
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';



export default function AboutUsPage() {
    const aboutUsRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);


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
        <main
            className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-yellow-700 relative overflow-hidden"
            style={{
                backgroundImage: "url('/confetti.png')",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "cover",
            }}
        >
            {/* Semi-transparent overlay */}
            <div className="absolute inset-0 bg-black opacity-50"></div>
            
            {/* Content Wrapper */}
            <div className="relative z-10 max-w-6xl text-center text-white">
                <h1 className="text-5xl font-extrabold mb-8 animate-bounce">About Us</h1>
                <p className="text-2xl mb-12">
                    At Talento, we are redefining how talents and opportunities connect.
                    Our talent booking management system simplifies discovering, booking,
                    and managing talent across industries. Whether you’re a talent agency, 
                    a brand, or an individual artist, Talento empowers you with the tools to shine.
                </p>

                {/* Section: Mission */}
                <section className="mb-14 bg-yellow-600 bg-opacity-80 rounded-lg p-8 shadow-lg">
                    <h2 className="text-4xl font-semibold border-b border-gray-300 pb-4 mb-6">
                        Our Mission
                    </h2>
                    <p className="text-xl">
                        To bridge the gap between exceptional talent and outstanding opportunities 
                        through innovative technology, seamless management, and unparalleled support.
                    </p>
                </section>

                {/* Section: Vision */}
                <section className="mb-14 bg-yellow-600 bg-opacity-80 rounded-lg p-8 shadow-lg">
                    <h2 className="text-4xl font-semibold border-b border-gray-300 pb-4 mb-6">
                        Our Vision
                    </h2>
                    <p className="text-xl">
                        To be the go-to platform for talent management worldwide, inspiring creativity, 
                        collaboration, and growth in every industry we serve.
                    </p>
                </section>

                {/* Section: Goals */}
                <section className="mb-14 bg-yellow-600 bg-opacity-80 rounded-lg p-8 shadow-lg">
                    <h2 className="text-4xl font-semibold border-b border-gray-300 pb-4 mb-6">
                        Goals and Objectives
                    </h2>
                    <ul className="list-disc list-inside text-left text-xl leading-relaxed">
                        <li>Empower talents by showcasing their skills.</li>
                        <li>Simplify and automate talent booking processes.</li>
                        <li>Foster industry growth and nurture talent development.</li>
                        <li>Promote transparency with clear processes and secure transactions.</li>
                        <li>Innovate continuously with the latest technologies.</li>
                    </ul>
                </section>

                <section className="mb-16 bg-yellow-600 bg-opacity-80 rounded-lg p-8 shadow-lg">
    <h2 className="text-4xl font-semibold border-b border-gray-300 pb-4 mb-8">
        Meet Our Team
    </h2>
    <p className="text-xl mb-8">
        Behind Talento is a team of passionate individuals dedicated to
        bringing the best talent management experience to life.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Team Member 1 */}
        <div className="flex flex-col items-center group">
            <a
                href="https://www.facebook.com/john.tumulak.376" // Replace with the actual link
                target="_blank"
                rel="noopener noreferrer"
            >
                <div className="w-40 h-40 rounded-full overflow-hidden shadow-lg mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <img
                        src="/tumulak.jpg"
                        alt="Project Manager"
                        className="w-full h-full object-cover"
                    />
                </div>
            </a>
            <h4 className="text-2xl font-semibold text-white">John Clifford A. Tumulak</h4>
            <p className="text-gray-200 text-lg">Project Manager</p>
        </div>

        {/* Team Member 2 */}
        <div className="flex flex-col items-center group">
            <a
                href="https://www.facebook.com/ninorey.garbo.7" // Replace with the actual link
                target="_blank"
                rel="noopener noreferrer"
            >
                <div className="w-40 h-40 rounded-full overflow-hidden shadow-lg mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <img
                        src="/garbo.jpg"
                        alt="Hacker"
                        className="w-full h-full object-cover"
                    />
                </div>
            </a>
            <h4 className="text-2xl font-semibold text-white">Nino Rey P. Garbo</h4>
            <p className="text-gray-200 text-lg">Hacker</p>
        </div>

        {/* Team Member 3 */}
        <div className="flex flex-col items-center group">
            <a
                href="https://www.facebook.com/kj.oporto14" // Replace with the actual link
                target="_blank"
                rel="noopener noreferrer"
            >
                <div className="w-40 h-40 rounded-full overflow-hidden shadow-lg mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <img
                        src="/oporto.jpg"
                        alt="Hacker"
                        className="w-full h-full object-cover"
                    />
                </div>
            </a>
            <h4 className="text-2xl font-semibold text-white">Kris Justin A. Oporto</h4>
            <p className="text-gray-200 text-lg">Hacker</p>
        </div>

        {/* Team Member 4 */}
        <div className="flex flex-col items-center group">
            <a
                href="https://www.facebook.com/casul.ian" // Replace with the actual link
                target="_blank"
                rel="noopener noreferrer"
            >
                <div className="w-40 h-40 rounded-full overflow-hidden shadow-lg mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <img
                        src="/casul.jpg"
                        alt="Hipster"
                        className="w-full h-full object-cover"
                    />
                </div>
            </a>
            <h4 className="text-2xl font-semibold text-white">Ian Jeoffrey G. Casul</h4>
            <p className="text-gray-200 text-lg">Hipster</p>
        </div>

        {/* Team Member 5 */}
        <div className="flex flex-col items-center group">
            <a
                href="https://www.facebook.com/jamesgarthcliff.albejos" // Replace with the actual link
                target="_blank"
                rel="noopener noreferrer"
            >
                <div className="w-40 h-40 rounded-full overflow-hidden shadow-lg mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <img
                        src="/albejos.jpg"
                        alt="Tester"
                        className="w-full h-full object-cover"
                    />
                </div>
            </a>
            <h4 className="text-2xl font-semibold text-white">James Garthcliff Albejos</h4>
            <p className="text-gray-200 text-lg">Tester</p>
        </div>
    </div>
</section>

            </div>
        </main>
        </div>
    );
}
