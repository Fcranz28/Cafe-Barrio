-- Migrate existing local image references; preserve customized external URLs and all product data.
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865099/cafe-barrio/blend.svg' WHERE image_url='/images/blend.svg';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865107/cafe-barrio/ceramic-mug.webp' WHERE image_url='/images/ceramic-mug.webp';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865107/cafe-barrio/coffee-blend.webp' WHERE image_url='/images/coffee-blend.webp';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865108/cafe-barrio/coffee-cajamarca.webp' WHERE image_url='/images/coffee-cajamarca.webp';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865109/cafe-barrio/coffee-cusco.webp' WHERE image_url='/images/coffee-cusco.webp';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865110/cafe-barrio/coffee.svg' WHERE image_url='/images/coffee.svg';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865117/cafe-barrio/french-press.webp' WHERE image_url='/images/french-press.webp';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865117/cafe-barrio/hero.svg' WHERE image_url='/images/hero.svg';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865125/cafe-barrio/kit-compartir.webp' WHERE image_url='/images/kit-compartir.webp';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865125/cafe-barrio/kit-ritual.webp' WHERE image_url='/images/kit-ritual.webp';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865126/cafe-barrio/kit.svg' WHERE image_url='/images/kit.svg';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865130/cafe-barrio/logo-cafe-rio.jpg' WHERE image_url='/images/logo-cafe-rio.jpg';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865130/cafe-barrio/manual-grinder.webp' WHERE image_url='/images/manual-grinder.webp';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865131/cafe-barrio/mug.svg' WHERE image_url='/images/mug.svg';
UPDATE products SET image_url='https://res.cloudinary.com/dgj2ol5r1/image/upload/v1790865138/cafe-barrio/press.svg' WHERE image_url='/images/press.svg';
