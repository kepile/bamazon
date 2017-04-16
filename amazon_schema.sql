 -- NORMALLY, YOU WOULD TYPE CREATE DATABASE DBNAME/ USE TABLENAME OR CREATE TABLE
Use x23yl6pjlul10ex0;


CREATE TABLE homeproducts (
  
  item_id INT(9) AUTO_INCREMENT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  department_name VARCHAR(200) NOT NULL,
  price NUMERIC(15,2) NOT NULL,
  stock_quantity INT(9) NOT NULL,
  PRIMARY KEY (item_id)
  );


 INSERT INTO products (product_name, department_name, price, stock_quantity)
 VALUES ("forks", "kitchen", 1.00, 100),
("napkins", "kitchen", 6.99, 100),
("spoons", "kitchen", 1.00, 100),
("knives", "kitchen", 1.50, 100),
("pots", "kitchen", 175.00, 19),
("sheets", "bedroom", 75.00, 123),
("pillow", "bedroom", 21.99, 100),
("blanket", "bedroom", 250.00, 49),
("towels", "bathroom", 11.25, 19),
("rugs", "bathroom", 15.90, 39),
("sink", "bathroom", 1075.00, 109),
("flowers", "gardening", 15.90, 39),
("soil", "gardening", 15.90, 39),
("rake", "gardening", 11.00, 39),
("mower", "gardening", 15015.90, 39);



