INSERT INTO categories(name) VALUES ('Café'),('Kits'),('Accesorios');
INSERT INTO products(name,description,price,stock,image_url,active,category_id) VALUES
('Café de origen · Cusco','Café en grano de altura. Notas de chocolate, caramelo y frutos secos. Bolsa de 250 g.',28.00,24,'/images/coffee.svg',TRUE,(SELECT id FROM categories WHERE name='Café')),
('Blend de la casa','Nuestro favorito de cada mañana. Tueste medio, cuerpo suave y un final dulce. Bolsa de 250 g.',25.00,30,'/images/blend.svg',TRUE,(SELECT id FROM categories WHERE name='Café')),
('Café de origen · Cajamarca','Un café de aroma floral y acidez delicada. Tueste medio. Bolsa de 250 g.',32.00,18,'/images/coffee.svg',TRUE,(SELECT id FROM categories WHERE name='Café')),
('Kit ritual de mañana','Café de origen de 250 g, una taza y un pequeño detalle para empezar bien el día.',65.00,12,'/images/kit.svg',TRUE,(SELECT id FROM categories WHERE name='Kits')),
('Kit para compartir','Dos bolsas de café de 250 g y dos tazas. Un regalo para disfrutar juntos.',95.00,8,'/images/kit.svg',TRUE,(SELECT id FROM categories WHERE name='Kits')),
('Prensa francesa','Prepara tu café sin apuro. Prensa de vidrio de 350 ml con filtro de acero.',45.00,15,'/images/press.svg',TRUE,(SELECT id FROM categories WHERE name='Accesorios')),
('Taza de cerámica','Tu compañera de todos los días. Cerámica color crema, capacidad de 300 ml.',22.00,20,'/images/mug.svg',TRUE,(SELECT id FROM categories WHERE name='Accesorios')),
('Molino manual','Muele al momento y descubre todos los aromas de tu café. Muelas de cerámica.',79.00,0,'/images/press.svg',TRUE,(SELECT id FROM categories WHERE name='Accesorios'));
