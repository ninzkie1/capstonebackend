<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ApplicationApproved extends Mailable
{
    use Queueable, SerializesModels;

    public $performer;

    /**
     * Create a new message instance.
     *
     * @param array $performer
     */
    public function __construct($performer)
    {
        $this->performer = $performer;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Application Approved')
                    ->view('emails.application_approved');
    }
}
