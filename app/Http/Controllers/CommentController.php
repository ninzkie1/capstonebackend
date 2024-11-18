<?php
// CommentController.php
namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;


class CommentController extends Controller
{
    
// CommentController.php
public function store(Request $request, $postId) {
    // Validate incoming request
    $validated = $request->validate([
        'user_id' => 'required|integer',
        'content' => 'required|string',
    ]);

    // Create a new comment
    $comment = Comment::create([
        'post_id' => $postId,
        'user_id' => $validated['user_id'],
        'content' => $validated['content'],
    ]);

    return response()->json($comment, 201);
}    

    public function index($postId)
    {
        $comments = Comment::where('post_id', $postId)->with('user')->get();
        return response()->json($comments);
    }
}
