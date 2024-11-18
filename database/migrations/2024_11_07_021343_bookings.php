<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
        {
            Schema::create('bookings', function (Blueprint $table) {
                $table->id(); 
                $table->unsignedBigInteger('client_id');  
                $table->unsignedBigInteger('performer_id');  
                $table->string('event_name');     
                $table->string('theme_name');    
                $table->date('start_date');  
                $table->time('start_time');  
                $table->time('end_time')->nullable(); 
                $table->string('municipality_name');
                $table->string('barangay_name');   
                $table->text('notes')->nullable();
                $table->string('status')->default('PENDING');
                $table->timestamps();  
    
                // Foreign Key Constraints
                $table->foreign('performer_id')->references('id')->on('performer_portfolios')->onDelete('cascade');
                $table->foreign('client_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    
        /**
         * Reverse the migrations.
         */
      

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
