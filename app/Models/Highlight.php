<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Highlight extends Model
{
    use HasFactory;

    protected $fillable = [
        'portfolio_id',
        'highlight_video',
    ];

    public function portfolio()
    {
        return $this->belongsTo(PerformerPortfolio::class, 'portfolio_id');
    }
}
