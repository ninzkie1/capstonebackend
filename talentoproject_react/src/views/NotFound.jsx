import React from 'react';


export default function NotFound() {
    return (
        <section className="page_404 min-h-screen bg-white flex items-center justify-center font-serif">
            <div className="container">
                <div className="text-center">
                    <div
                        className="four_zero_four_bg relative h-80 bg-cover bg-center"
                        style={{
                            backgroundImage:
                                "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')",
                        }}
                    >
                        <h1 className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 text-8xl font-bold text-gray-800">
                            404
                        </h1>
                    </div>
                    <div className="contant_box_404 mt-[-50px]">
                        <h3 className="text-2xl font-bold mb-4">Look like you're lost</h3>
                        <p className="mb-6 text-lg text-gray-600">
                            The page you are looking for is not available!
                        </p>
                        <a
                            href="/"
                            className="bg-green-500 text-white py-2 px-6 rounded-lg hover:bg-green-600 transition"
                        >
                            Go to Home
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
