<?php

use App\Http\Controllers\Api\V1\AddressController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CartController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\DeliveryController;
use App\Http\Controllers\Api\V1\FavoriteController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProductImageController;
use App\Http\Controllers\Api\V1\ReviewController;
use App\Http\Controllers\Api\V1\ShopController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Public Product Reviews
    |--------------------------------------------------------------------------
    */

    Route::get('/products/{productId}/reviews', [
        ReviewController::class,
        'productReviews',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::prefix('auth')->group(function () {

        Route::post('/register', [
            AuthController::class,
            'register',
        ]);

        Route::post('/login', [
            AuthController::class,
            'login',
        ]);

        Route::post('/forgot-password', [
            AuthController::class,
            'forgotPassword',
        ]);

        Route::post('/reset-password', [
            AuthController::class,
            'resetPassword',
        ]);

        Route::middleware('auth:sanctum')->group(function () {

            Route::post('/logout', [
                AuthController::class,
                'logout',
            ]);

            Route::get('/me', [
                AuthController::class,
                'me',
            ]);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/notifications', [
            NotificationController::class,
            'index',
        ]);

        Route::get('/notifications/unread-count', [
            NotificationController::class,
            'unreadCount',
        ]);

        Route::patch('/notifications/{notification}/read', [
            NotificationController::class,
            'markAsRead',
        ]);

        Route::patch('/notifications/read-all', [
            NotificationController::class,
            'markAllAsRead',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Client
    |--------------------------------------------------------------------------
    */

    Route::middleware([
        'auth:sanctum',
        'role:client',
    ])->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Reviews
        |--------------------------------------------------------------------------
        */

        Route::post('/reviews', [
            ReviewController::class,
            'store',
        ]);

        Route::get('/my-reviews', [
            ReviewController::class,
            'myReviews',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Favorites
        |--------------------------------------------------------------------------
        */

        Route::get('/favorites', [
            FavoriteController::class,
            'index',
        ]);

        Route::post('/favorites', [
            FavoriteController::class,
            'store',
        ]);

        Route::delete('/favorites/{productId}', [
            FavoriteController::class,
            'destroy',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Cart
        |--------------------------------------------------------------------------
        */

        Route::prefix('cart')->group(function () {

            Route::get('/', [
                CartController::class,
                'show',
            ]);

            Route::post('/items', [
                CartController::class,
                'store',
            ]);

            Route::put('/items/{item}', [
                CartController::class,
                'update',
            ]);

            Route::delete('/items/{item}', [
                CartController::class,
                'destroy',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Addresses
        |--------------------------------------------------------------------------
        */

        Route::prefix('addresses')->group(function () {

            Route::get('/', [
                AddressController::class,
                'index',
            ]);

            Route::post('/', [
                AddressController::class,
                'store',
            ]);

            Route::put('/{address}', [
                AddressController::class,
                'update',
            ]);

            Route::delete('/{address}', [
                AddressController::class,
                'destroy',
            ]);
        });

        /*
        |--------------------------------------------------------------------------
        | Orders
        |--------------------------------------------------------------------------
        */

        Route::prefix('orders')->group(function () {

            Route::get('/', [
                OrderController::class,
                'index',
            ]);

            Route::post('/', [
                OrderController::class,
                'store',
            ]);

            Route::get('/{order}', [
                OrderController::class,
                'show',
            ]);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Seller
    |--------------------------------------------------------------------------
    */

    Route::middleware([
        'auth:sanctum',
        'role:seller,admin',
    ])->group(function () {

        Route::get('/seller/orders', [
            OrderController::class,
            'sellerOrders',
        ]);

        Route::patch('/orders/{order}/status', [
            OrderController::class,
            'updateStatus',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Driver
    |--------------------------------------------------------------------------
    */

    Route::middleware([
        'auth:sanctum',
        'role:driver',
    ])->group(function () {

        Route::get('/driver/deliveries', [
            DeliveryController::class,
            'driverDeliveries',
        ]);

        Route::get('/driver/deliveries/{delivery}', [
            DeliveryController::class,
            'show',
        ]);

        Route::patch('/driver/deliveries/{delivery}/status', [
            DeliveryController::class,
            'updateStatus',
        ]);

        Route::get('/driver/deliveries/{delivery}/history', [
            DeliveryController::class,
            'history',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin
    |--------------------------------------------------------------------------
    */

    Route::middleware([
        'auth:sanctum',
        'role:admin',
    ])->prefix('admin')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Product Moderation
        |--------------------------------------------------------------------------
        */

        Route::patch('/products/{product}/approve', [
            ProductController::class,
            'approve',
        ]);

        Route::patch('/products/{product}/publish', [
            ProductController::class,
            'publish',
        ]);

        Route::patch('/products/{product}/reject', [
            ProductController::class,
            'reject',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Category Management
        |--------------------------------------------------------------------------
        */

        Route::post('/categories', [
            CategoryController::class,
            'store',
        ]);

        Route::put('/categories/{category}', [
            CategoryController::class,
            'update',
        ]);

        Route::delete('/categories/{category}', [
            CategoryController::class,
            'destroy',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Shop Management
        |--------------------------------------------------------------------------
        */

        Route::patch('/shops/{shop}/approve', [
            ShopController::class,
            'approve',
        ]);

        Route::patch('/shops/{shop}/suspend', [
            ShopController::class,
            'suspend',
        ]);

        Route::patch('/shops/{shop}/activate', [
            ShopController::class,
            'activate',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Review Moderation
        |--------------------------------------------------------------------------
        */

        Route::patch('/reviews/{review}/approve', [
            ReviewController::class,
            'approve',
        ]);

        Route::patch('/reviews/{review}/reject', [
            ReviewController::class,
            'reject',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Delivery Management
        |--------------------------------------------------------------------------
        */

        Route::get('/deliveries', [
            DeliveryController::class,
            'adminIndex',
        ]);

        Route::patch('/orders/{order}/delivery/assign', [
            DeliveryController::class,
            'assign',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Product Images
    |--------------------------------------------------------------------------
    */

    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/products/{product}/images', [
            ProductImageController::class,
            'store',
        ]);

        Route::delete('/product-images/{productImage}', [
            ProductImageController::class,
            'destroy',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Shops
    |--------------------------------------------------------------------------
    */

    Route::get('/shops/{shop}', [
        ShopController::class,
        'show',
    ]);

    Route::middleware('auth:sanctum')->group(function () {

        Route::middleware('role:seller')->group(function () {

            Route::get('/seller/shop', [
                ShopController::class,
                'myShop',
            ]);

            Route::post('/shops', [
                ShopController::class,
                'store',
            ]);
        });

        Route::put('/shops/{shop}', [
            ShopController::class,
            'update',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Products
    |--------------------------------------------------------------------------
    */

    Route::get('/products', [
        ProductController::class,
        'index',
    ]);

    Route::get('/products/{product}', [
        ProductController::class,
        'show',
    ]);

    Route::middleware('auth:sanctum')->group(function () {

        Route::post('/products', [
            ProductController::class,
            'store',
        ]);

        Route::put('/products/{product}', [
            ProductController::class,
            'update',
        ]);

        Route::delete('/products/{product}', [
            ProductController::class,
            'destroy',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | Categories
    |--------------------------------------------------------------------------
    */

    Route::get('/categories', [
        CategoryController::class,
        'index',
    ]);

    Route::get('/categories/{category}', [
        CategoryController::class,
        'show',
    ]);
});