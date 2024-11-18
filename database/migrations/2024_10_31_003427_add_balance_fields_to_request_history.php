<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('request_history', function (Blueprint $table) {
        $table->decimal('balance_before', 15, 2)->nullable();
        $table->decimal('balance_after', 15, 2)->nullable();
    });
}

public function down()
{
    Schema::table('request_history', function (Blueprint $table) {
        $table->dropColumn(['balance_before', 'balance_after']);
    });
}
};
