-- Replace the original demonstration illustrations, preserving administrator-uploaded URLs.
UPDATE products SET image_url='/images/coffee-cusco.webp'
WHERE name='Café de origen · Cusco' AND image_url='/images/coffee.svg';
UPDATE products SET image_url='/images/coffee-blend.webp'
WHERE name='Blend de la casa' AND image_url='/images/blend.svg';
UPDATE products SET image_url='/images/coffee-cajamarca.webp'
WHERE name='Café de origen · Cajamarca' AND image_url='/images/coffee.svg';
UPDATE products SET image_url='/images/kit-ritual.webp'
WHERE name='Kit ritual de mañana' AND image_url='/images/kit.svg';
UPDATE products SET image_url='/images/kit-compartir.webp'
WHERE name='Kit para compartir' AND image_url='/images/kit.svg';
UPDATE products SET image_url='/images/french-press.webp'
WHERE name='Prensa francesa' AND image_url='/images/press.svg';
UPDATE products SET image_url='/images/ceramic-mug.webp'
WHERE name='Taza de cerámica' AND image_url='/images/mug.svg';
UPDATE products SET image_url='/images/manual-grinder.webp'
WHERE name='Molino manual' AND image_url='/images/press.svg';
