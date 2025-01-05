<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sender_id');
            $table->unsignedBigInteger('receiver_id')->nullable(); // for group chats, this can be null
            $table->unsignedBigInteger('group_chat_id')->nullable(); // Add group chat field
            $table->text('message');
            $table->json('seen_by')->nullable();
            $table->timestamp('seen_at')->nullable();
            $table->timestamps();

            $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('receiver_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('group_chat_id')->references('id')->on('group_chats')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('chats');
    }
};
