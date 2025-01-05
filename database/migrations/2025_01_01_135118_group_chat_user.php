<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('group_chat_user', function (Blueprint $table) {
            $table->unsignedBigInteger('group_chat_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->foreign('group_chat_id')->references('id')->on('group_chats')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->primary(['group_chat_id', 'user_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('group_chat_user');
    }
};
