This node application creates an Amazon-like storefront with MySQL db as inventory control. The table homeproducts exists in the db x23yl6pjlul10ex0 which was created through the heroku platform.  

The app bamazonCustomer.js takes in orders from customers and depletes stock from the store's inventory. 

The Node application bamazonManager.js. is a management functionality that allows managers in each department perform the following functionality:

- View Products for Sale
- View Low Inventory
- Add to Inventory
- Add New Product

The app uses the following node modules:
  console.table
  f/s 
  inquirer
  mysql
