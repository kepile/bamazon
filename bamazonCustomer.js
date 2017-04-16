require('console.table');
// var listinventory = require("./inventory.js");
var inquirer = require('inquirer');
var mysql = require('mysql');
var connection = mysql.createConnection({
	host: 'wvulqmhjj9tbtc1w.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
	port: 3306,

	user:'x63jxhp19sc1k8pp',
	password:'dg6y2esrihqa8zun',
	database: 'x23yl6pjlul10ex0'

});
// variable that holds all purchases
var purchase = [];

 
 // beginning menu for customer
function start(purchase){
	console.log("\n ------------------- Welcome to Bamazon ------------------- \n")

	// if an item has been added to the purchase array, 
	// add option to checkout to the menu choices 
	if (purchase.length > 0){
		var optionsArr = ["Add item to basket", "Check out", "Exit"]
	} else
	{//else do not offer the option to checkout
		var optionsArr = ["Add item to basket", "Exit"]
	}
    // prompt for action to be taken with array optionsArr from above
	inquirer.prompt([

		{
			name: "action",
	        type: "rawlist",
	         message: "What would you like to do?",
		    choices: optionsArr

	       }
		       
		]).then(function (answer) {
		    
		    if (answer.action === "Add item to basket") {
			    addItem(purchase);
			} else  if (answer.action === "Check out"){
				checkout();
			} else
			{
				connection.end();
			}

		});
	}

// allow customer to add items ot "basket"/purchase array
function addItem(purchase){
		console.log("\n -------------------  BAMAZON STORE -------------------  \n")

	// query db to retrieve all items for sale
	connection.query('SELECT item_id, product_name, price FROM homeproducts', function (error, results, fields) {
	  if (error) console.log(" \n****  error displaying product table **** ");    
	// display results in a table
		console.table(results);
		// create an array of valid item ids for validation of input
		// 0 is included as an exit if customer enters 0
		var validitem = [0];
		for (var i = 0; i<results.length; i++){
			validitem.push(results[i].item_id);
	    }
	    
	    
		 
		 // prompt for item to be purchased
		inquirer.prompt([

		{
		    name: "choice",
	        type: "input",
	         message: " Please enter the ID of the product you would like to buy. \n  Enter 0 to exit.",
		     validate: function(value) {
		     	// check that the answer is a number that is between 0
		     	// and the number of options in the results
				 if (isNaN(value) === false && 
				 	validitem.indexOf(parseInt(value)) >= 0) {
	         	        return true;
				    }
				    return false;
			      }
			     
		}       
		]).then(function (answers) {
		    // if the number is the number of aproduct number, get
		    // quantity the customer would like
		    
			if (answers.choice > 0){
		    	getquant(answers.choice, purchase);
			} else if (answers.choice == 0)
			{ //else 0 was entered so go back to the menu
				
				start(purchase);

			} else
			{
				console.log("\n   ******* PLEASE ENTER A VALID ID NUMBER ******");
		    	addItem(purchase);
			}

		});
	}) 
}


// prompt the user for the quantity they would like to purchase
function getquant(id, purchase){
	
		inquirer.prompt([
	     {
		    name: "qty",
	        type: "input",
	         message: "How many would you like to purchase?",
		     validate: function(num) {
		     if (isNaN(num) === false && num>0) {
		     	return true;
		     	}
		     return false;
		      }	
	         }
		]).then(function(ans){
		// retrieve quantity available from the db
		   connection.query('SELECT * FROM homeproducts where item_id =?', [id], function (error, results, fields) {
			  if (error) console.log("**** error checking stock level for product **** "); 
			  var qty = parseInt(ans.qty);
			  
			  // check if there is enough stock to fill the order
			  if (results[0].stock_quantity < qty){
			  	// if stock in db is less than quantity being purchased
			  	// send error to console
			  	console.log("\n***** Insufficient stock to fill this quantity. Current stock level is " + results[0].stock_quantity + ". Please select a different quantity. **** ");
				// return to get new quantity
				 getquant(id, purchase);
			  } else
			  { //else enough stock is available to fill order
			  	// create an item_no for the order by getting number of items
			  	// in basket/purchase Array and adding 1
			  	var item_no = purchase.length + 1;
			  	// create a constructor and add the item to purchase Array
			  	purchase.push( new itemConstructor(item_no, results[0].product_name, 
			  		results[0].price, qty, results[0].price*qty));
			  	console.log("\n");
			  	console.table(purchase);
			  	// call function to confirm basket with the callback function start as a  parameter 
			    confirmItem(purchase, start);
			  };
			  
		 	}); 
		})
	}

// confirm items in basket
function confirmItem(purchase, callbackfunc){
	// display items in basket/purchase array

  	inquirer.prompt(
		{
			name: "confirm",
			type: "list",
			message: "Is this correct?",
			choices: ["Yes", "No, remove an item", "Empty Basket"]

	}).then(function(confirmAns){

		if(confirmAns.confirm === "Yes"){
			// if items in basket are ok, go back to top menu for next steps
			callbackfunc(purchase);
		  } else if (confirmAns.confirm === "Empty Basket") {
		  	// else if emptying items in basket
		  	// empty the purchase array and return to top menu

		  	purchase = [];
		  
		  	start(purchase);
		  } else
		  { //else call function to allow single items to be removed
		     removeitem(purchase, callbackfunc);
		  }
		  
  });     

	
}


// function to remove items from the basket/purchase array
function removeitem (purchase, callbackfunc){
	// prompt for which item to remove
  inquirer.prompt([
    {
	  name: "delItem",
	  type: "input",
      message: "Please enter the item number you would like to remove. \n If you do not want to remove any items, enter 0.",
	     validate: function(num) {
		     if (isNaN(num) === false && num>=0 && num <= purchase.length) {
		     	return true;
		    }
			    return false;
	    }	
    }
	]).then(function(ans){

		if (ans.delItem == 0){
			// exit was selected so return to menu to confirm purchase
			  	
				confirmItem(purchase, callbackfunc)
		} else
		{   //an item to remove was selected so remove it from the array
			// get the index of the item by subtracting 1 from the item no
			// that was entered at the prompt
			purchase.splice(ans.delItem-1, 1);
			// check if any items remain in the array
			 if (purchase.length > 0){
			 	// renumber the item numbers for the products in array listed
			 	// after the product that was removed
		    	for(var i = ans.delItem-1; i<purchase.length; i++){
		    		purchase[i].item_no = i+1;
		    	}
		    	// return to menu to confirm basket
				console.log("\n");
			  	console.table(purchase);
		    	confirmItem(purchase, callbackfunc);	
		    } else
		    { //if no other items in the basket, return to main menu
		    	start(purchase);
		    }
		}
    });
}


// function to process order and update quantity in db
function checkout(){
	// variable to hold total owed
	var total = 0;
	
	// add up items in basket
	for (var i =0; i<purchase.length; i++){
		total = purchase[i].totalcost(total);
	}

	// display all items and total due 

	console.log("\n------------------- BAMAZON CHECKOUT ------------------- \N");
	console.table(purchase);
	console.log("TOTAL DUE                       " + total + "\n");
	// confirm itmes in basket.  Has a callback function as a parameter
	confirmItem(purchase, function(purchase){
		// Prompt for payment
		 inquirer.prompt([
		    {
			  name: "order",
			  type: "rawlist",
		      message: "Please select Pay to process your payment of " + total,
		      choices: ["Pay", "Continue Shopping", "Exit"]
				    
		    }
			]).then(function(choice){

				if (choice.order === "Pay"){
				// Pay was selected: loop thru array of items and update the db
					for (var i =0; i< purchase.length; i++){
						// constructor prototype to subtract inventory 
					    purchase[i].inventory();
					}
					// empty the basket/purchase array
					purchase = [];
					console.log("\n **** Thank you for your order! ****  \n");
					// go to the beginning menu
					start(purchase);
				} else if (choice.order === "Continue Shopping")
				{//call function to add items to basket
					addItem(purchase);
				} else
				{//go back to the main menu
					start(purchase);
				}

					
			})
	    });
}


// constructor to create items to be purchased
function itemConstructor (item_no, product_name, price, qty, total){
	if (this instanceof itemConstructor){	
		this.item_no = item_no; 
	    this.item = product_name; 
	    this.price = price;
	    this.quantity = qty; 
  	    this.total_due = total;
  	} else
  	{
  		return new itemConstructor (item_no, product_name, price, qty, total);
  	}

}

// prototype function to add up items in basket/purchase array
itemConstructor.prototype.totalcost = function(total){
 	total += this.total_due;
	return total;

}


// prototype function to subtract inventory for items in basket/purchase Array
itemConstructor.prototype.inventory = function(){

	connection.query(
		
		"UPDATE homeproducts SET stock_quantity = (stock_quantity - ?) WHERE product_name = ?"
		,[this.quantity, this.item]
		,function(err, results){
			if(err) throw err;
			
			});

}


connection.connect(function(err){
	if (err) throw err;
});
start(purchase);