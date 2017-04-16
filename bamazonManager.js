require('console.table');
const fs = require('fs');
var inquirer = require('inquirer');
var mysql = require('mysql');
var format = require('date-format');
var connection = mysql.createConnection({
	host: 'wvulqmhjj9tbtc1w.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
	port: 3306,

	user:'x63jxhp19sc1k8pp',
	password:'dg6y2esrihqa8zun',
	database: 'x23yl6pjlul10ex0'

});
// Variable stores the department as it will be searched with MySQL.  
// If user selects "ALL", department holds a MySQL searchable list of all departments 
var department = "";
// Variable stores the department as it will be console logged.  
// If user selects "ALL", "All" is stored. 
var displayDept;
// Variable stores the departments retrieved from a database 
// search of unique departments.
var departmentArr = [];
// Global Variable to store the user information for logging activity
var user = ""; 

 
function start(){
	console.log("\n          BAMAZON MANAGER INVENTORY CONTROL");
	console.log("_________________________________________________________\n");
	// Perform initial query to get unique department list
   connection.query('SELECT DISTINCT department_name FROM homeproducts ', function (error, results, fields) {
	  if (error) console.log(" \n error retrieving departments");    
		
		// Push the list of departments into an array
		 for (var i = 0; i < results.length; i++){
		 	departmentArr.push(results[i].department_name);
		 }
		 // Add the option of "ALL" for user to select initially
			departmentArr.push("ALL");

	// Allow users to sign in and select the department they belong to 
	inquirer.prompt([

		{
			name: "user",
	        type: "input",
	         message: "\n What is your user id?",
	         validate: function(value){
				if (value.trim() === ""){
					return false;
				}
				return true;
	         }

        },
		{
			name: "department",
	        type: "rawlist",
	         message: "\n What department would you like to modify?",
		     choices: departmentArr

        }
		       
		]).then(function (answer) {
			// store user in global variable to use for logging activity
			user = answer.user;
			// log in file that user signed in
			log.logActivity({activity: 'log in',
				         user: answer.user,
				         department: answer.department,
					     date: format.asString('hh:mm:ss.SSS')});
			
			// Store department in global variable to be used for display
			displayDept = answer.department;

			// if user is looking at all departments, remove the option of ALL from the Array
			// and use that array to create a MySQL searchable string with all departments
			if (answer.department === "ALL"){
				departmentArr.pop();
				for (var i = 0; i< departmentArr.length; i++){
					if (i===0){
						department += "'" + departmentArr[i] + "'";
					} else
					{
					 department += ", '" + departmentArr[i] + "'";
					}
				}
			// else if a single department was selected, create a searchable string
			} else
			{
				department = "'" + answer.department + "' ";
			}
			
			// go to function where a user selects what they want to do
			activity();
		});
	});
}

// function that logs user activity into a file for tracking
function LogFile(file){
	// create object file to store user activity
	this.file = 'log/' + file;
	// write log to file.  Log contains the actions the user has completed
    this.logActivity = function(log) {
    
		fs.appendFile(this.file, JSON.stringify(log) + '\n', function (err){
			if (err) throw err;
		})
	}
}

// function that routes program based in inquiry responses about what 
// activity the user wants to do
function activity(){
		console.log("\n                     Main Menu");
	console.log("_________________________________________________________\n");

	// prompt user on activity to do
	inquirer.prompt([

		{
			name: "action",
	        type: "rawlist",
	         message: "\n What would you like to do?",
		    choices: ["View Products for Sale", "View Low Inventory",
				 "Add to Inventory", "Add New Product", "Exit"]

	       }
		       
		]).then(function (answer) {
			// route user to the function based on what activity was selected
		     switch(answer.action) {
			    
			    case 'View Products for Sale':
			        viewProducts();
			        break;
			    case 'View Low Inventory':

				    log.logActivity({activity: 'inventory check',
						         user: user,
							     date: format.asString('hh:mm:ss.SSS')});
				    viewLowInventory();
			        break;
			    case 'Add to Inventory':
				    addInventory();
			        break;
			    case 'Add New Product':
			        console.log("\n         ADD PRODUCTS for " + displayDept);
					console.log("______________________________________________________\n");
					addProduct();
			        break;
		        case 'Exit':
				    log.logActivity({activity: 'log out',
							         user: user,
								     date: format.asString('hh:mm:ss.SSS')});

			        connection.end();
			        break;
			    default:
			        console.log(" \n An error has occurred.  Try again.");
			        activity();
			}

		});
	}

//  function that displays all products in the department that was selected
function viewProducts(){
	// display heading in console log
	console.log("\n         INVENTORY REPORT FOR " + displayDept);
	console.log("_____________________________________________________ \n" );

	// query the database for all products in department
	connection.query('SELECT item_id, product_name, price, stock_quantity FROM homeproducts where department_name in (' + department +  ')' , function (error, results, fields) {
	  if (error) console.log(" \n error displaying product table");    
	// Display the results in a table
	 console.table(results);
	// Callback to activity to determine next activity user would select
	 activity();
		
	}) 
}


// function that displays products with a low inventory.  
// User can select level but there is a default of 5.
function viewLowInventory(){
	// display heading in console log
	console.log("\n         LOW INVENTORY REPORT for " + displayDept);
	console.log("______________________________________________________\n");
	// ask user what level they would like the iventory to be under
		inquirer.prompt([
	     {
		    name: "qty",
	        type: "input",
	         message: "What is the stock level for the products you would like to retrieve?",
	         default: 5,
		     validate: function(num) {
		     if (isNaN(num) === false && num>=0) {
		     	return true;
		     	}
		     return false;
		      }	
	         }
		]).then(function(ans){
			// query the db for any products in the selected department 
			// that have a stock quantity at or below the input given above.
		   connection.query('SELECT  item_id, product_name, price, stock_quantity FROM homeproducts where department_name in (' 
			   	+ department +  ') and stock_quantity <=?', [ans.qty], function (error, results, fields) {
			  if (error) console.log("error checking stock level for products"); 
			  // check to see if any records were returned in the query
			  if (results.length <=0){
			  	// If no records were returned, send message to console log
			  	console.log("No products found with stock level at or below " + ans.qty);
			  } else{
			  	// if products have been found in the query, show them in console
			  console.table(results);
			  }
			  // callback to return to the activity function for user to select next activity
			  activity(); 
		})
	})
}

// function that allows user to add inventory to existing products
function addInventory(){
	// display heading in console log
	console.log("\n         INVENTORY CONTROL for " + displayDept);
	console.log("_________________________________________________________\n");
	// Query the db to display existing inventory levels in the department user selected
	connection.query('SELECT item_id, product_name, price, stock_quantity FROM homeproducts where department_name in (' 
			   	+ department +  ')', function (error, results, fields) {
		if (error) {
		  	console.log(" \n error displaying product table");  
		} else  
		// if an error was not received display the table
			{
		  	console.table(results);
			// check if any products were found for that department
			if (results.length <=0){
				// if no products returned, display message and return to select a different activity
				console.log("\n No products found in this department.");
				activity();		
			} 
			// create an array of valid item_no for selected department.
			// this will be used for validation during inquirer
			var validitem = [0];
			for (var i = 0; i<results.length; i++){
				validitem.push(results[i].item_id);
		    }

			console.log("\n");
			// Ask user to select the product to change
			inquirer.prompt([
				{
				name: "itemchange",
		        type: "input",
		        message: " Please enter the ID of the product to be changed. \n    Enter a 0 to return to menu.",
			     validate: function(value) {
			     	// validate a number was received that is positive and 
			     	// exists in the table displayed/returned query
			        if (isNaN(value) === false && 
				 	validitem.indexOf(parseInt(value)) >= 0) {
	         	        return true;
				    }
				    return false;
			      } 
				}
			]).then(function(Invans){
				if (Invans.itemchange  < 1){
					// If user entered a 0, they exited inventory function 
					// and return to select another activity
					activity();
				} else
				{ // else a valid item no was received so ask for new inventory
					// total inventory is input instead of adding to existing inventory
				 	inquirer.prompt([
					{
					name: "newQty",
				    type: "input",
				    message: " Please enter the new quantity:",
				     validate: function(value) {
				     if (isNaN(value) === false && value <= 999999999 &&
				     	  value>=0) {
					        return true;
					      }
					      return false;

				      }
					}
					]).then(function(ans){
						// get all the information from that id
						connection.query('SELECT  product_name, stock_quantity FROM homeproducts where item_id =?', [parseInt(Invans.itemchange)], 
							function (error, results, fields) {
				     		if (error) {
							  	console.log(" \n error reading product table. " + error);    
							} else 
							{ //store info in an obj to be passed to the callback function and
								// later used to update db
								var ParamArr = {id: Invans.itemchange, 
									product: results[0].product_name,
									current_qty: results[0].stock_quantity, 
									newQty: ans.newQty
								};
								// display the info that will be added to the db before
								// calling the function to confirm the info
								console.log('\n Change the inventory of ' + ParamArr.product +
								 	' from ' + ParamArr.current_qty + " to " + ParamArr.newQty);						
								// call function to ask user to verify the info to be added to db
								// this function call includes 2 parameters.  The first, ParamArr
								// is the obj that holds the data to update the db.  The second
								// parameter defines a callback function that will be executed
								// at the end of the confirmChange function
								confirmChange(ParamArr, function(confirmAns, ParamArr){
									// beginning of callback function
									// if No is returned in confirmChange, go back to the top of add inventory
									if(confirmAns.confirm === "No"){
										addInventory();
									} else
									{  // else yes was returned so update db
										connection.query("UPDATE homeproducts SET stock_quantity = " + ParamArr.newQty + " WHERE item_id =" + ParamArr.id, function(err, results){
											console.log("retrieved");
											if (err) {  //show error on console and store success = fale
												// success is used to make a log for the transction
												console.log('Error updating inventory to database homeproducts.  \n Inventory NOT CHANGED!');
												var success = false
											} else 
											{ //else no err so show successfule message to console
												// store success to be used for a log of the transaction
												console.log('Iventory update to Database successful');
												var success = true;
											}
											// record a log on the activity completed
											log.logActivity({activity: 'Inventory Update',
													         user: user,
														     date: format.asString('hh:mm:ss.SSS'),
														     product_name: ParamArr.product,
														     current_inventory: ParamArr.current_qty,
														     new_inventory: ParamArr.newQty,
														     result:success});
											// return loop back to the start menu for add Inventory
											addInventory()	
										})			
									}
								});
							}
						});
					});
				}
			})
		}
	})
}



// function to add a product to the database
function addProduct(){
// prompt the user for the information to add the product
	inquirer.prompt([
		{
			name: "product",
	        type: "input",
	        message: "\n Please enter the name of the product to be added:",
	        validate: function(value){
	        	if (value.trim() === ""){
	        		return false
	        	}
	        	 return true
	        }
		},
		{
			name: "price",
	        type: "input",
	        message: " Please enter the price (xxx.xx): ",
// validate the price 1)it is a number, 2) greater than 0 3) is less than
// the limit set at time of creation and only has 2 decimals
			     validate: function(value) {
			         if (isNaN(value) === false &&  value>=0
			             && value <= 99999999999.99 && value.toString().split(".")[1].length < 3) {
				         return true;
			         }	  
			         console.log("  *** Please enter a valid price. ");
				     return false;
			      }
		},
		{
			// Enter inventory and validate the price 1)it is a number, 
			// 2) greater than 0 3) is less than
			// the limit set at time of creation 
			name: "qty",
	        type: "input",
	        message: " Please enter the inventory quantity: ",
			     validate: function(value) {
			         if (isNaN(value) === false &&  value>=0
			             && value <= 999999999) {
				         return true;
			         }	  			         
				     return false;
			      }
	    }

	]).then(function(ans){
	  connection.query('SELECT product_name	 FROM homeproducts ', function (error, results, fields) {
		  if (error) console.log(" \n error retrieving departments");    
			// ParamArr is an object that can be passed to functions
			// This object holds all the information required to update
			// the db and write a log file
		  var i=0
		  var found = false;
		  while ( i<results.length && !found){
		  	if (results[i].product_name === ans.product.trim().toLowerCase()){
			  	// check if the product being added already exists in the db
			  	found = true;
		  	}
		  	i++;
		  }
		  if (found){
			console.log("\n ****** This product already exists ****** ");
		  	nextStep();
	  	  } else
	  	  {
			var ParamArr = {product: ans.product.trim().toLowerCase(),
							price: ans.price, 
							Qty: ans.qty,
						    depart: ""};
			// If the user signed in under ALL departments, prompt user for
			// what department the product should have
			// the var departmentArr is defined when user signs in
			if (displayDept	=== 'ALL'){
				inquirer.prompt([
				{
					name: "department",
					type: "rawlist",
					message: "Select the department: ",
					choices: departmentArr
				}
				]).then(function(answer){
					// store the department into the object
					ParamArr.depart = answer.department;
					// call function to add product to db
					addtoDB(ParamArr);
				})
			} else
			{ 
				// else if ALL was not selected, store in obj the department input at the start 
				ParamArr.depart = displayDept;	
				// call function to add product to db
				addtoDB(ParamArr);
			}
		};
	  });
	})
}


// function that first confirms that information is correct,
// adds the info to the db and logs the activity in the file 
function addtoDB(ParamArr){
	// console the information to be added to the db
	console.log('\n Add the product ' + ParamArr.product + ' department: ' + ParamArr.depart +
	 	' price: ' +  ParamArr.price + ' quantity: ' + ParamArr.Qty);						
	// call a function to confirm the info should be added and use a callback function
	// to determine what should be done based on the user information
	confirmChange(ParamArr, function(confirmAns, ParamArr){
		// If the user responded that the information was not correct, 
		// the product is not added and the function nextStep will ask if user 
		// would like to add a different product
		if(confirmAns.confirm === "No"){
			nextStep();
		} else
		// else If the user responded that the information was correct, 
		// the product is added to the db
		{
			connection.query("INSERT INTO homeproducts (product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)",
				[ParamArr.product, ParamArr.depart, ParamArr.price, ParamArr.Qty]
				,function(err, results){
			// if product is not added, show an error to console and set success to false
			// success is used to log the result of this insert
				if (err) {
					console.log('Error updating product to database homeproducts.  \n Inventory NOT CHANGED!');
					var success = false
				} else 
				{
					// else show message to console that product was added and store true in success
					console.log('\n Product added to Database successful');
					var success = true;
				}
				// record a log in the log file for this transaction
				log.logActivity({activity: 'Add Product',
							         user: user,
								     date: format.asString('hh:mm:ss.SSS'),
								     product_name: ParamArr.product,
								     price: ParamArr.price,
								     inventory: ParamArr.Qty,
								     result:success});
							 
		// the function nextStep will ask if user would like to add another product
				nextStep();	
			})			
		}
	});
				
}
					
// after every transaction to add a product, prompt user if they would 
// like to continue adding products
function nextStep(){
 	inquirer.prompt([
		{
		name: "step",
		type: "list",
		message: "\n Would you like to add another product?",
		choices: ["Yes", "No"]

		}
	]).then(function(Ans){
		// responding to add another product calls the function to add product
		if (Ans.step === "Yes"){
			addProduct();
		} else
		{ // else function sends back to initial menu to select an activity
			activity();
		}
	});		
}





// this function is accessed by the add product and add inventory functions
// it validates info before storing to database
// the info is sent to console log then confirmChange is called
// ParamArr is an object containing the data that is being confirmed. 
// this object will be accessed in the callbackfunc
// callbackfunc is a callback that is executed after the prompt.  
// It is defined at the point where this function is called.
function confirmChange( ParamArr, callbackfunc){

  	inquirer.prompt([
		{
		name: "confirm",
		type: "list",
		message: "Is this correct?",
		choices: ["Yes", "No"]

		}
	]).then(function(confirmAns){
		// execute the callback defined at the point where confirmChange was called
		// the callback function is different depending on where confirmChange was called
		// param passed: the answer Yes or No from prompt and ParamArr which was
		// passed thru confirmChange from the original function
		// ParamArr looks different depending on where the call originated from
		callbackfunc(confirmAns, ParamArr);
		});					
}





// create constructor for the log file
// a new file is created each day by basing the name on the date
// the date is retrieved using npm date-format package
var log = new LogFile('manager_' + format.asString('yyyy_MM_dd') + '.log');

// establish a connection to the database
connection.connect(function(err){
	if (err) throw err;
});

start();