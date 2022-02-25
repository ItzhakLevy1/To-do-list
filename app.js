//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-Itzhak:Test123@cluster0.iwftx.mongodb.net/todolistDB"); // Specifing how to connect to mongodb and which data base to connect to.

const itemsSchema = {  // Setting a schema structor for the data base.
  name: String
};

const Item = mongoose.model("Item", itemsSchema);  // Creating a model based on the schema and creating a collection called "items" in our data base.

const item1 = new Item({  // Creating documents according to the schema.
  name: "Welcome to your todolist !"
});

const item2 = new Item({  // Creating documents according to the schema.
  name: "Hit the + button to add a new item."
});

const item3 = new Item({  // Creating documents according to the schema.
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3]; // Putting all 3 document in an array so we can use "insertMany" from mongoose.

const listSchema = {  // Every list we (or the user) will create will have a name and a list(array) of items(documents).
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){              // Inside our collection of items "Item" we look for all of our items.

    if (foundItems.length === 0){                     // Only if there are no items in the collection.
      Item.insertMany(defaultItems, function(err){  // 1.Creating and inserting default items into the data bese.
        if (err){
          console.log(err)
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");  // 2.AND redirecting to our root rout.
    } else {            // If the default items allready exist do not add them again and only render the new items into the list.ejs.
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customListName", function(req, res){ // Creating a dynamic redirection, "/:customListName" represents what ever the user has entered in the url after the "/".
  const customListName = _.capitalize(req.params.customListName);  // using lodash we capitalize the first letter in each custom / dynamically created list and lowercase the rest.

  List.findOne({name: customListName}, function(err, foundList){  // Checking if a list in the collection of lists already exists with the same name as the one the user is currently tring to access using mongoose "findOne" method.
    if (!err){
      if (!foundList){                     // If no identical list was found we go ahead and create the new list.
        const list = new List({           // Giving a structre of a name and an array of items to every newly created list.
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {                          // If an identical list was found we display it.
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });



});

app.post("/", function(req, res){       // When this "/" post rout is trigerd we can tap into the line below.
  const itemName = req.body.newItem;  // This refers to the text the user entered into the input when they clicked on the + button, which is represented as "input type="text" in the form in the list.ejs file.
  const listName = req.body.list;    // By referring to the form button with the name of "list" we can access the value of "listTitle".

  const item = new Item({         // Creating a new item from the item model.
    name: itemName              // we got the "itemName" from the list.ejs file as mentioned above.
  });

  if (listName === "Today"){    // If the list is the default list.
    item.save();              // Saving the above item into our collection of items.
    res.redirect("/");      // Redirecting to the home route after saving the item process above.
  } else {                //  If the list isn't the default list.
    List.findOne({name: listName}, function(err, foundList){  // Locating the custom / dynamically created list and than
      foundList.items.push(item);                             // adding the new item to that list.
      foundList.save();
      res.redirect("/" + listName);   // Redirecting to the new custom / dynamically created list.
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;  // Gaining access to the input type="checkbox" in the list.ejs file form.
  const listName = req.body.listName;     // Gaining access to the input value in the list.ejs file form.

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){  // Deleting an item from the "Today" list.
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {  // From our "List" model we call "findOneAndUpdate", 1.we get the list name from the "listName" in the ejs and in the above app.post, 2.then we pull from the items array the item wich has the specefied id, 3. we use a callback.
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName); // If there is no error redirect to the custom / dynamically created list.
      }
    });

  }


  });

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
