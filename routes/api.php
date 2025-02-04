<?php

use App\Http\Controllers\AddressController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminWalletController;
use App\Http\Controllers\ApplicantsController;
use App\Http\Controllers\ApplicationsController;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PerformerController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ComplaintsController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PerformerApplicationController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\TCoinController;
use App\Http\Controllers\UnavailableDateController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WalletController;
use App\Models\Applicants;
use App\Models\Transaction;
use App\Http\Controllers\RecommenderController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
Route::middleware('auth:sanctum')->get('/users/{id}', [UserController::class, 'show']);
Route::middleware('auth:sanctum')->put('/users/{id}', [UserController::class, 'update']);




Route::group(['middleware' => ['auth:sanctum', 'admin']], function () {
    Route::get('/users', [AdminController::class, 'index']); // List all users
    Route::get('/users/{id}', [AdminController::class, 'show']); // Retrieve a specific user
    Route::post('/users', [AdminController::class, 'store']); // Create a new user
    Route::put('/users/{id}', [AdminController::class, 'update']); // Update a user
    Route::delete('/users/{id}', [AdminController::class, 'destroy']); // Delete a user
    Route::post('/users/{userId}/add-talento-coin', [TCoinController::class, 'addTalentoCoin']);
    Route::post('/users/{userId}/deduct-talento-coin', [TCoinController::class, 'deductTalentoCoin']);
    Route::get('/display-request', [WalletController::class, 'getDepositRequests']);
    Route::post('/payments/{id}/decline', [WalletController::class, 'declineRequest']);
    Route::post('/payments/{id}/approve', [WalletController::class, 'approveRequest']);
    Route::post('/withdrawals/{id}/approve', [WalletController::class, 'approveWithdrawRequest']);
    Route::post('/withdrawals/{id}/decline', [WalletController::class, 'declineWithdrawRequest']);
    Route::get('/request-history', [WalletController::class, 'getRequestHistory']);
    Route::post('/wallet-info', [AdminWalletController::class, 'store']);
    Route::get('/display-withdraw-request', [WalletController::class, 'getWithdrawRequests']);
    Route::post('/wallet-info/{id}', [AdminWalletController::class, 'update']);
    Route::patch('/transactions/{transactionId}/approve',[TCoinController::class, 'approveTransaction']);
    Route::get('/performer-applications', [PerformerApplicationController::class, 'index']);
    Route::put('/performer-applications/{id}/approve', [PerformerApplicationController::class, 'approve']);
    Route::put('/performer-applications/{id}/reject', [PerformerApplicationController::class, 'reject']);
    Route::get('/admin/summary-report', [AdminController::class, 'getSummaryReport']);
    Route::get('/sales', [AdminController::class, 'getAdminBalance']);
    Route::get('/admin/bookings', [AdminController::class, 'showBookings']);
    Route::put('/admin/bookings/{id}', [AdminController::class, 'updateBooking']);
    Route::delete('/admin/bookings/{id}', [AdminController::class, 'deleteBooking']);
    Route::get('/admin/booking-details', [AdminController::class, 'getBookingDetails']);
    Route::get('/admin/today-bookings', [AdminController::class, 'getTodayBookings']);
    Route::get('/admin/cancelled-bookings', [AdminController::class, 'getCancelledBookings']);
    Route::get('/admin/approved-bookings', [AdminController::class, 'getApprovedBookings']);
    Route::get('/admin/transaction-details', [AdminController::class, 'getTransactionDetails']);
    Route::get('/admin/talent-bookings', [AdminController::class, 'getBookingsByTalentDetails']);
    /////
//    Route::delete('/notifications/{id}', [ChatController::class, 'deleteNotification']);
});


Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::post('/users', [UserController::class, 'store']);
Route::get('/users/{id}', [UserController::class, 'getUser']);
Route::get('/users/{id}/profile-image', [UserController::class, 'fetchUserProfileImage']);
Route::get('/users/profile-images', [UserController::class, 'fetchAllUserProfileImages']);






Route::middleware('auth:sanctum')->group(function () {
    // Route::get('/performer', [PerformerController::class, 'index']);
     
    // Route::get('/performer/{id}', [PerformerController::class, 'show']);
    Route::get('/performers/{userId}/portfolio', [PerformerController::class, 'show']);
    // Route::post('/performer/{userId}', [PerformerController::class, 'update']);
    Route::put('/performers/{userId}/portfolio', [PerformerController::class, 'update']);
    Route::post('/performers/{userId}/upload-videos', [PerformerController::class, 'uploadHighlightVideos']);
    Route::delete('/performers/highlights/{highlightId}', [PerformerController::class, 'deleteHighlightVideo']);

    //same raman ni silag function
    // Route::post('/performers/{userId}/store-profile-image', [PerformerController::class, 'storePortfolioImage']);
    Route::post('performers/{id}/update-portfolio-image', [PerformerController::class, 'updatePortfolioImage']);
    Route::post('/users/{id}', [UserController::class, 'update']);


    //getRecommended Performer based on Filtered by theme and events
    Route::get('/filter-performers', [PerformerController::class, 'filterPerformersByEventAndTheme']);



    //average inside the reviews
    Route::get('/performervid', [PerformerController::class, 'getVideo']);
    Route::post('/performers/{performerId}/rate', [FeedbackController::class, 'store']);//feedback performer
    
    // Get ratings for a performer
    Route::get('/performers/{performerId}/ratings', [FeedbackController::class, 'getRatings']);

    //Validate the user if the user is already have a record of booking that performer
    Route::get('/performers/{performerId}/can-leave-review', [FeedbackController::class, 'canLeaveReview']);
});
//sa homepage ni
Route::get('/performer', [PerformerController::class, 'getHighlights']);
Route::get('/performers', [PerformerController::class, 'getPerformers']);


Route::get('/users', [UserController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/posts', [CustomerController::class, 'index']); // gawas tanan post if naka login ra
    Route::post('/posts', [CustomerController::class, 'store']); // add post
    Route::post('/posts/{postId}/apply', [ApplicationsController::class, 'apply']);
    Route::get('/getApplicants', [ApplicationsController::class, 'getApplications']);
    Route::put('/posts/{id}', [CustomerController::class, 'update']); // Update a post
    Route::delete('/posts/{id}', [CustomerController::class, 'destroy']); // Delete a post
    Route::get('/events', [EventController::class, 'getEvents']);
    Route::get('/events/{eventId}/themes', [EventController::class, 'getThemesByEvent']);
    Route::get('/portfolio/{portfolioId}', [CustomerController::class, 'getPortfolio']);
    Route::get('/municipalities', [AddressController::class, 'getMunicipalities']);
    Route::get('/municipalities/{id}/barangays', [AddressController::class, 'getBarangaysByMunicipality']);
    Route::get('/chats/unread-count', [ChatController::class, 'getUnreadCount']);
    Route::get('/get-booking-notifications', [NotificationController::class, 'getBookingNotifications']);
    Route::delete('/booking-notifications/{id}', [NotificationController::class, 'deleteBookingNotification']);
});






Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
Route::post('/posts/{post}/comments', [CommentController::class, 'store']);


//deposit
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/deposit-request', [WalletController::class, 'store']);
    Route::get('/talento_coin_balance', [WalletController::class, 'showBalance']);
    Route::post('/withdraw-request', [WalletController::class, 'withdraw']);
    Route::get('/user-request-history', [WalletController::class, 'getUserRequestHistory']);
    Route::post('/bookings', [BookingController::class, 'store']); // Create a booking
    Route::get('/bookings', [BookingController::class, 'index']); // Get bookings to the user currently loginF
    Route::get('/bookings/{id}', [BookingController::class, 'show']); // Get booking by ID
    Route::get('/wallet-info', [AdminWalletController::class, 'show']); // Get wallet information of the admin
    Route::get('/notifications', [WalletController::class, 'getNotifications']);
    Route::delete('/delete-notifi/{id}', [WalletController::class, 'deleteNotification']);
    //pending booking for performer
    Route::get('/performers/{performerId}/bookings', [BookingController::class, 'getBookingsForPerformer']);//for booking request in the performer
    Route::get('/performers/{performerId}/unavailable-dates', [UnavailableDateController::class, 'index']);
    Route::post('/unavailable-dates', [UnavailableDateController::class, 'store']);
    Route::put('/bookings/{id}/accept', [BookingController::class, 'acceptBooking']);
    Route::put('/bookings/{id}/decline', [BookingController::class, 'declineBooking']);
    // Route::post('/bookPerformer', [BookingController::class, 'bookPerformer']);
    Route::get('/transactions', [TransactionController::class, 'index']); // Fetch all transactions
    Route::get('/performer-trans', [TransactionController::class, 'getPerformerTransactions']);
    Route::get('/performer/{performerId}/performer-trans', [TransactionController::class, 'getClientPerformerTransactions']);
    Route::get('/client-trans', [TransactionController::class, 'getClientTransactions']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']); // Fetch a specific transaction by ID
    Route::post('/transactions', [TransactionController::class, 'store']); // Create a new transaction
    Route::put('/transactions/{id}/approve', [TransactionController::class, 'approveTransaction']);//approve the transaction if the user already satisfied and the performer fullfill the clients booking to release the TalentoCoin
    Route::put('/transactions/{id}/decline', [TransactionController::class, 'declineTransaction']);
    Route::put('/bulktransactions/approve', [TransactionController::class, 'bulkapproveTransaction']);
    Route::put('/bulktransactions/decline', [TransactionController::class, 'bulkdeclineTransaction']);

    Route::put('/transactions/{id}/decline', [TransactionController::class, 'declineTransaction']);
    Route::post('/update-profile', [CustomerController::class, 'updateProfile']);
    Route::get('/client-info', [CustomerController::class, 'getLoggedInClient']);
     Route::get('/getMyPost', [CustomerController::class, 'getUserPosts']);
    Route::post('/profile', [CustomerController::class, 'showProfile']); 
    // Route::get('/accepted-client', [BookingController::class, 'getAcceptedBookings']);
    Route::get('/performers/{performerId}/accepted-bookings', [BookingController::class, 'getAcceptedBookingsForPerformer']);
    Route::get('/performers/{performerId}/declined-bookings', [BookingController::class, 'getDeclinedBookingsForPerformer']);
    Route::get('/can-chat/{clientId}', [ChatController::class, 'canChat']);
    // Route::get('/canChatClients', [ChatController::class, 'getClientsWithAcceptedBookings']);
     Route::get('/canChatClients', [ChatController::class, 'canChatClients']);
    Route::get('/canChatPerformer', [ChatController::class, 'canChatPerformer']);
    Route::get('/getAdmin', [UserController::class, 'getAdmin']);
    Route::get('/performers/{performerId}/performerPendingDates', [UnavailableDateController::class, 'getPendingBookingDates']);
    Route::get('/performer/can-chat-applicants', [ChatController::class, 'canChatApplicants']);
    Route::get('/client/can-chat-client', [ChatController::class, 'canChatPostClient']);
    Route::put('applications/{applicationId}/approve', [ApplicationsController::class, 'approve']);
    Route::put('applications/{applicationId}/decline', [ApplicationsController::class, 'decline']);
    Route::post('/complaints', [ComplaintsController::class, 'store']); // User submits a complaint
    Route::get('/complaints', [ComplaintsController::class, 'index']); // Admin fetches all complaints
    Route::put('/complaints/{id}/respond', [ComplaintsController::class, 'respond']); // Admin responds to a complaint
    Route::get('/user/profile', [UserController::class, 'fetchAuthenticatedUserProfile']);
    
    Route::get('/getPendingBookings', [BookingController::class, 'getPendingBookings']);
    Route::put('/bookings/{bookingId}/cancel', [TransactionController::class,'cancelBooking']);
    Route::get('/getMyBooking', [BookingController::class, 'getPendingBookingsForAuthenticatedUser']);
    Route::get('/recommended', [BookingController::class, 'recommendedPerformers']);
    Route::get('/get-notif', [ChatController::class, 'fetchChatNotifications']);
    Route::delete('/noty/{id}', [NotificationController::class, 'deleteNotifications']);
    Route::post('/chats/seen', [ChatController::class, 'markAsSeen']);
     Route::post('/notifications/mark-read/{id?}', [NotificationController::class, 'markAsRead']);
      Route::post('/track-video-play', [CustomerController::class, 'trackVideoPlay']);
    Route::get('/recommendations', [RecommenderController::class, 'getRecommendations']);
    Route::get('/top-performers', [RecommenderController::class, 'getTopPerformers']);
    


}); 
Route::get('/chats', [ChatController::class, 'index']);
Route::post('/chats', [ChatController::class, 'store']);   

// Route::middleware(['web'])->group(function () {
//     Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail']);
//     Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);
    
// });
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);