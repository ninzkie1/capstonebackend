<x-guest-layout>
    <x-authentication-card>
        <x-slot name="logo">
            <!-- Removed logo as requested -->
        </x-slot>

        <x-validation-errors class="mb-4" />

        <form id="resetPasswordForm" method="POST" action="{{ route('password.update') }}" class="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-md space-y-6">
            @csrf

            <input type="hidden" name="token" value="{{ $request->route('token') }}">

            <h2 class="text-center text-xl font-bold mb-4 text-gray-800">Reset Your Password</h2>

            <!-- Display email as plain text -->
            <div class="space-y-2">
                <x-label for="email" value="{{ __('Email') }}" />
                <p class="block mt-1 w-full bg-gray-100 text-gray-700 rounded-md p-3 shadow-sm">
                    Hi, {{ old('email', $request->email) }} change your password quickly!
                </p>
            </div>

            <!-- Password field -->
            <div class="space-y-2">
                <x-label for="password" value="{{ __('Password') }}" />
                <x-input id="password" 
                         class="block mt-1 w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm p-3" 
                         type="password" 
                         name="password" 
                         required 
                         autocomplete="new-password" />
            </div>

            <!-- Confirm password field -->
            <div class="space-y-2">
                <x-label for="password_confirmation" value="{{ __('Confirm Password') }}" />
                <x-input id="password_confirmation" 
                         class="block mt-1 w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm p-3" 
                         type="password" 
                         name="password_confirmation" 
                         required 
                         autocomplete="new-password" />
            </div>

            <!-- Reset password button -->
            <div class="flex items-center justify-center mt-6">
                <x-button class="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-center">
                    {{ __('Reset Password') }}
                </x-button>
            </div>
        </form>
    </x-authentication-card>

    <script>
        document.getElementById('resetPasswordForm').addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the default form submission

            const formData = new FormData(this);

            fetch("{{ route('password.update') }}", {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}' // Send CSRF token
                }
            })
            .then(response => {
                if (response.ok) {
                    // If successful, redirect to React login page
                    window.location.href = 'http://192.168.254.116:5173/login'; // Change to your React login URL
                } else {
                    // Handle error responses
                    return response.json().then(err => {
                        alert(err.message); // Display error message
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    </script>
</x-guest-layout>
