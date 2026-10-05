<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $electronics = Category::create([
            'name' => 'Electronics',
            'status' => 'active',
        ]);

        $fashion = Category::create([
            'name' => 'Fashion',
            'status' => 'active',
        ]);

        $home = Category::create([
            'name' => 'Home & Living',
            'status' => 'active',
        ]);

        Category::create([
            'parent_id' => $electronics->id,
            'name' => 'Laptops',
            'status' => 'active',
        ]);

        Category::create([
            'parent_id' => $electronics->id,
            'name' => 'Smartphones',
            'status' => 'active',
        ]);

        Category::create([
            'parent_id' => $electronics->id,
            'name' => 'Accessories',
            'status' => 'active',
        ]);

        Category::create([
            'parent_id' => $fashion->id,
            'name' => 'Women',
            'status' => 'active',
        ]);

        Category::create([
            'parent_id' => $fashion->id,
            'name' => 'Men',
            'status' => 'active',
        ]);

        Category::create([
            'parent_id' => $home->id,
            'name' => 'Furniture',
            'status' => 'active',
        ]);

        Category::create([
            'parent_id' => $home->id,
            'name' => 'Decoration',
            'status' => 'active',
        ]);
    }
}