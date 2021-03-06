//home.js

// This contains all the client-side js for the application

// Some templates that are compiled on the spot with asynchronous data
var post_template = require("./templates/post.hbs");
var autocomplete_template = require("./templates/autocomplete.hbs");

// Tool to allow client-sde rendering of hbs. This file is compiled using hbsfy and stored in
// /resources/scripts/compiled/home.js
var Handlebars = require("hbsfy/runtime");

// Human readable timestamp from UNIX timestamp
Handlebars.registerHelper('time', function(value, options)
{
    var a = (new Date(value) + "").split(" ");
    var t = a[4].split(":");
    return a[0] + ", " + a[1] + " " + a[2] + ", " + a[3] + " at " + ((t[0]==0)?12:t[0]%12) + ":" + t[1] + " " + ((t[0] >= 12)?"pm":"am");
});

// Match regex in string and surround it with <b></b>
Handlebars.registerHelper('boldify', function(string, regex, options)
{
    return string.replace(new RegExp('(' + regex + ')', 'i'), "<b>$1</b>");
});

// When the page loads, this is executed
$(function() {
    populateFeed();
    checkFontSize();

    // Add functionality to mail reply buttons
    // convoluted syntax to preserve value of el
    for(let el of document.getElementsByClassName("reply-btn"))
    {
        el.onclick = function(messageid, senderid)
        {
            return function()
            {
                sendMail(document.getElementById("mailReplyMessage_" + messageid).value, senderid);
            };
        }(el.id.split("_")[1], el.id.split("_")[2]);
    }

    // Set up event listeners
    $("#font125").click(function(){setFontSize(125);});
    $("#font150").click(function(){setFontSize(150);});
    $("#font175").click(function(){setFontSize(175);});
    $("#font200").click(function(){setFontSize(200);});
    $("#postStatusBtn").click(postStatus);
    $("#submitSignupBtn").click(userRegistration);
    $("#submitLoginBtn").click(userLogin);
    $("#signoutBtn").click(logout);
    $("#profileTabActivity").click(showActivity);
    $("#profileTabPhotos").click(showGallery);
    $("#profileTabEvents").click(showEvents);
    $("#profileTabMail").click(showMessages);
    $("#mailCancelBtn").click(resetMail);
    $("#mailNameSearchBox").on('keyup', mailAutoComplete);
});

// Called when a user types into the search box, sends what they typed to the /search-by-name
// endpoint on the server and modifies the page accordingly
function mailAutoComplete()
{
    var str = document.getElementById("mailNameSearchBox").value;
    var resultsDiv = document.getElementById("mailSearchResults");

    $.post('/ajax/search-by-name', {search: str}, function(results)
    {
        resultsDiv.innerHTML = "";
        for(var user of results)
        {
            // Lists off the matching names, with regex match bolded
            resultsDiv.innerHTML += autocomplete_template({user: user, str: str});
        }

        // convoluted syntax to preserve the value of el
        for(let el of document.getElementsByClassName("autocompleteItem"))
        {
            el.onclick = function(id)
            {
                return function()
                {
                    for(var u of results)
                        if(u._id == id)
                            setRecipient(u);
                };
            }(el.id.split("_")[1]);
        }
    });
}

// Sets environment for sending mail to a user
function setRecipient(user)
{
    var nameBox = document.getElementById("mailRecipientName");

    // Have the name of the recipient at the top
    nameBox.innerHTML = "<h3>" + user.name + "</h3>";

    // Switch the top half from searching for a name to writing a message
    nameBox.hidden = false;
    document.getElementById("mailTopHalf").hidden = true;

    // Show send button and set it to send the message when it's clicked
    var sendButton = document.getElementById("mailSendBtn");
    sendButton.hidden = false;
    sendButton.onclick = function()
    {
        sendMail(document.getElementById("mailMessageBox").value, user._id);
    };
}

// Send mail by posting it to the server
function sendMail(text, userid)
{
    $.post('/ajax/send-mail',
    {
        messageText : text,
        recipientUserID : userid
    }, function(res)
    {
        resetMail();
        console.log(res);
    });
}

// Reset the mail environment
function resetMail()
{
    document.getElementById("mailNameSearchBox").value = "";
    document.getElementById("mailMessageBox").value = "";
    document.getElementById("mailTopHalf").hidden = false;
    document.getElementById("mailRecipientName").hidden = true;
    document.getElementById("mailSearchResults").innerHTML= "";
}

// Create a new post by sending it to the server
function postStatus()
{
    $.post("/ajax/new-post",
    {
        messageBody : document.getElementById("statusEntryField").value
    }, function(retData)
    {
        document.getElementById("statusEntryField").value = "";
        populateFeed();
    }).fail(function(err)
    {
        alert("Sorry, an error occurred. Please inform an administrator.");
        console.log(err);
    });
}

// Get posts from the server and add them to the feed
function populateFeed()
{
    var feed;
    try
    {
        feed= document.getElementById("feed");
        feed.innerHTML = "<h3 class='my-3'>Feed</h3>";
    }
    catch(e)
    {
        feed = document.getElementById("offlineFeedItemContainer");
    }

    $.get("/ajax/get-posts", function(posts)
    {
        // iterate backwards for newest first
        for(var i = posts.length - 1; i >=0; i--)
        {
            feed.innerHTML += post_template(posts[i]);
        }
    }).fail(function(err)
    {
        console.log(err);
        alert("Sorry, an error occurred. Please inform an administrator");
    });
}

// Log a user in
function userLogin(){

    var username = $("#userLoginName").val();
    var password = $("#userLoginPassword").val();

    if (username == "") {
		$("#loginFormAlert").html("<strong>Missing information: </strong>Please enter your username.");
		$("#loginFormAlert").removeClass("hidden-xs-up");
		$("#loginFormAlert").removeClass("alert-success");
		$("#loginFormAlert").addClass("alert-warning");
        $("#userLoginEmail").focus();
        return false;
    }
    else {
        $("#loginFormAlert").addClass("hidden-xs-up");
        $.ajax({
            method: "post",
            url: "/ajax/login",
            data: { usrLoginName : username, usrPass : password },
            success: function (response) {
                if (response) {
                    var obj = JSON.parse(response);

					if (obj.error) {
                        alert(obj.error);
						$("#loginFormAlert").removeClass("hidden");
						$("#loginFormAlert").removeClass("alert-success");
						$("#loginFormAlert").addClass("alert-warning");
					} else {
						location.reload();
					}
                }
            }
        });
    }
}

// Log the user out
function logout()
{
    $.ajax({
        method: "get",
        url: "/ajax/logout",
        success: function (response) {
            location.reload();
        }
    });
}

// Create new user: gether and validate form data, send it to the server, react accordingly
function userRegistration() {

    // get the fields
    var fullName = $("#userFullName").val();
    var userName = $("#userName").val();
    var password = $("#userPassword").val();
    var confirmPass = $("#userPasswordConfirm").val();

    // check them for non-emptiness (and that the passwords match)
    if (fullName.trim() === "") {
		$("#signupFormAlert").html("<strong>Missing information: </strong>Please enter your name.");
		$("#signupFormAlert").removeClass("hidden-xs-up");
		$("#signupFormAlert").removeClass("alert-success");
		$("#signupFormAlert").addClass("alert-warning");
        $("#userFirstName").focus();
        return false;
    } else if (userName.trim() == "") {
		$("#signupFormAlert").html("<strong>Missing information: </strong>Please enter a username.");
		$("#signupFormAlert").removeClass("hidden-xs-up");
		$("#signupFormAlert").removeClass("alert-success");
		$("#signupFormAlert").addClass("alert-warning");
        $("#userLastName").focus();
        return false;
    } else if (userName.indexOf(' ') >= 0) {
		$("#signupFormAlert").html("<strong>Missing information: </strong>Please enter a valid user name (no spaces).");
		$("#signupFormAlert").removeClass("hidden-xs-up");
		$("#signupFormAlert").removeClass("alert-success");
		$("#signupFormAlert").addClass("alert-warning");
        $("#userEmail").focus();
        return false;
    }
    else if (password.trim() !== confirmPass.trim()) {
		$("#signupFormAlert").html("<strong>Missing information: </strong>Passwords do not match. Please check and try again.");
		$("#signupFormAlert").removeClass("hidden-xs-up");
		$("#signupFormAlert").removeClass("alert-success");
		$("#signupFormAlert").addClass("alert-warning");
        $("#userPassword").focus();
        return false;
    }

    // gather the form data into an object to send to the server
    var formData = $("#signupForm").serialize();

	$("#signupFormAlert").addClass("hidden-xs-up");

    $.post("/ajax/create-user", formData, function(res)
    {
        console.log(res);

        if(res == "SUCCESS") showSuccessPrompt();
        else if(res == "username already registered")
        {
            $("#signupFormAlert").html("Username has already been taken. Please try another username.");
            $("#signupFormAlert").removeClass("hidden-xs-up");
            $("#signupFormAlert").removeClass("alert-success");
            $("#signupFormAlert").addClass("alert-warning");
            $("#userPassword").focus();
            return false;
        }
    });

}

// select the news feed
function showActivity(label) {

    $(".tabLabel").css({
        "background-color": "#ffffff",
        "color": "#000000"
    });

    $(label).css({
        "background-color": "#81e5bc",
        "color": "#ffffff"
    });


    $(".contentItem").fadeOut("slow").attr("hidden", true);
    $("#profileActivityContent").fadeIn("slow").attr("hidden", false);

}

// show messages
function showMessages(label) {

    $(".tabLabel").css({
        "background-color": "#ffffff",
        "color": "#000000"
    });

    $(label).css({
        "background-color": "#81e5bc",
        "color": "#ffffff"
    });

    $(".contentItem").fadeOut("slow").attr("hidden", true);
    $("#profileMailContent").attr("hidden", false).fadeIn("slow");

}

// popup on account creation
function showSuccessPrompt() {

    $("#signupForm").fadeOut("slow", function() {

        $("#signupModal .modal-footer").attr("hidden",true);
        $("#successPrompt").attr("hidden", false).fadeIn("slow");
    });
}

// gets the user's preferred font size
function checkFontSize() {

    $.ajax({

        type: "GET",
        url: "/ajax/get-font-size",
        success: function(size) {
            switch (size) {

                case "125":
                $("body").addClass("font-rg");
                break;

                case "150":
                $("body").addClass("font-lg");
                break;

                case "175":
                $("body").addClass("font-xl");
                break;

                case "200":
                $("body").addClass("font-xxl");
                break;

                default:
                $("body").addClass("font-rg");
                break;

            }
        }
    });
}

// sets the user's preferred font size
function setFontSize(size) {

    $.ajax({

        type: "POST",
        url: "/ajax/set-font-size",
        data: { fontSize: size },
        dataType: "json",
        success: function(response) {
            location.reload();
        }
    });
}

