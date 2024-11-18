import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'pusher',
    key: 'e1070b4f8d56ec053cee',  // Your Pusher app key
    cluster: 'us2',  // Your Pusher cluster
    forceTLS: true,  // Ensure TLS is being used for secure connections
    encrypted: true, // Encrypt the data over the wire
    authEndpoint: '/broadcasting/auth', // Default Laravel Echo auth endpoint
    auth: {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Send user token for authentication
        }
    }
});

export default echo;
