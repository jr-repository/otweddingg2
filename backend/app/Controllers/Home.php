<?php

namespace App\Controllers;

class Home extends BaseController
{
    public function index()
    {
        return $this->response->setJSON([
            'name'    => 'Otweddingg RSVP Backend',
            'status'  => 'ok',
            'message' => 'Backend is running. Use the API and export endpoints from the frontend dashboard.',
        ]);
    }
}
