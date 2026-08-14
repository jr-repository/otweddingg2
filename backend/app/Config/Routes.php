<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');
$routes->options('reports/rsvp/excel', 'ReportExportController::options');
$routes->get('reports/rsvp/excel', 'ReportExportController::excel');
$routes->options('reports/rsvp/pdf', 'ReportExportController::options');
$routes->get('reports/rsvp/pdf', 'ReportExportController::pdf');

$routes->group('api', static function ($routes): void {
    $routes->options('admin/login', 'Api\AdminAuthController::options');
    $routes->post('admin/login', 'Api\AdminAuthController::login');
    $routes->options('admin/me', 'Api\AdminAuthController::options');
    $routes->get('admin/me', 'Api\AdminAuthController::me');

    $routes->options('rsvp', 'Api\RsvpController::options');
    $routes->post('rsvp', 'Api\RsvpController::store');
    $routes->get('rsvps', 'Api\RsvpController::index');
    $routes->get('guest-pass/(:segment)', 'Api\GuestPassController::show/$1');

    $routes->options('admin/dashboard', 'Api\AdminGuestController::options');
    $routes->get('admin/dashboard', 'Api\AdminGuestController::dashboard');
    $routes->options('admin/guests', 'Api\AdminGuestController::options');
    $routes->get('admin/guests', 'Api\AdminGuestController::index');
    $routes->options('admin/guests/(:num)', 'Api\AdminGuestController::options');
    $routes->get('admin/guests/(:num)', 'Api\AdminGuestController::show/$1');
    $routes->options('admin/guests/(:num)/generate-pass', 'Api\AdminGuestController::options');
    $routes->post('admin/guests/(:num)/generate-pass', 'Api\AdminGuestController::generateGuestPass/$1');
    $routes->options('admin/check-in/manual', 'Api\AdminGuestController::options');
    $routes->post('admin/check-in/manual', 'Api\AdminGuestController::manualCheckIn');
    $routes->options('admin/check-in/scan', 'Api\AdminGuestController::options');
    $routes->post('admin/check-in/scan', 'Api\AdminGuestController::scanCheckIn');
    $routes->options('admin/photobooth/captures', 'Api\AdminPhotoboothController::options');
    $routes->get('admin/photobooth/captures', 'Api\AdminPhotoboothController::index');
    $routes->post('admin/photobooth/captures', 'Api\AdminPhotoboothController::store');
});
