#!/bin/bash
set -e

# Run database migrations
php artisan migrate --force

# Start Apache in foreground
apache2-foreground
