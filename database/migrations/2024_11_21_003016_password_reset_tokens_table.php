<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->id(); // Primary key
            $table->string('email'); // Email field
            $table->string('token'); // Token in plaintext
            $table->timestamp('created_at')->nullable(); // Creation time
            $table->index('email'); // Index for email
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
    }
};
