function userLogin(){
    
    var email = $("#userLoginEmail").val();
    var password = $("#userLoginPassword").val();
    
    if (!validateEmail(email)) {
		$("#loginFormAlert").html("<strong>Missing information: </strong>Please enter a valid email address.");
		$("#loginFormAlert").removeClass("hidden-xs-up");
		$("#loginFormAlert").removeClass("alert-success");
		$("#loginFormAlert").addClass("alert-warning");
        $("#userLoginEmail").focus();
        return false;
    } else if (password == "") {
        $("#loginFormAlert").html("<strong>Missing information: </strong>Please enter your password.");
		$("#loginFormAlert").removeClass("hidden-xs-up");
		$("#loginFormAlert").removeClass("alert-success");
		$("#loginFormAlert").addClass("alert-warning");
        $("#userLoginPassword").focus();
        return false;
    } else {
        $("#loginFormAlert").addClass("hidden-xs-up");
        $.ajax({
            method: "post",
            url: "ajax/login",
            data: { usrEmail : email, usrPass : password },
            success: function (response) {
                if (response) {
                    var obj = JSON.parse(response);
                    
					if (!obj.error) {
						$("#loginFormAlert").removeClass("hidden");
						$("#loginFormAlert").removeClass("alert-warning");
						$("#loginFormAlert").addClass("alert-success");
					} else {
						$("#loginFormAlert").removeClass("hidden");
						$("#loginFormAlert").removeClass("alert-success");
						$("#loginFormAlert").addClass("alert-warning");
					}
                }
            }
        });
    }
    
    
}

function userRegistration() {
    
    var firstName = $("#userFirstName").val();
    var lastName = $("#userLastName").val();
    var email = $("#userEmail").val();
    var password = $("#userPassword").val();
    var confirmPass = $("#userPasswordConfirm").val();
    
    if (firstName.trim() === "") {
		$("#signupFormAlert").html("<strong>Missing information: </strong>Please enter your first name.");
		$("#signupFormAlert").removeClass("hidden-xs-up");
		$("#signupFormAlert").removeClass("alert-success");
		$("#signupFormAlert").addClass("alert-warning");
        $("#userFirstName").focus();
        return false;
    } else if (lastName.trim() == "") {
		$("#signupFormAlert").html("<strong>Missing information: </strong>Please enter your last name.");
		$("#signupFormAlert").removeClass("hidden-xs-up");
		$("#signupFormAlert").removeClass("alert-success");
		$("#signupFormAlert").addClass("alert-warning");
        $("#userLastName").focus();
        return false;
    } else if (!validateEmail(email)) {
		$("#signupFormAlert").html("<strong>Missing information: </strong>Please enter a valid email address.");
		$("#signupFormAlert").removeClass("hidden-xs-up");
		$("#signupFormAlert").removeClass("alert-success");
		$("#signupFormAlert").addClass("alert-warning");
        $("#userEmail").focus();
        return false;
    } else if (password.trim() == "") {
		$("#signupFormAlert").html("<strong>Missing information: </strong>Please enter a valid password. Your password should not consist of only spaces.");
		$("#signupFormAlert").removeClass("hidden-xs-up");
		$("#signupFormAlert").removeClass("alert-success");
		$("#signupFormAlert").addClass("alert-warning");
        $("#userPassword").focus();
        return false;
    } else if (password.trim() !== confirmPass.trim()) {
		$("#signupFormAlert").html("<strong>Missing information: </strong>Passwords do not match. Please check and try again.");
		$("#signupFormAlert").removeClass("hidden-xs-up");
		$("#signupFormAlert").removeClass("alert-success");
		$("#signupFormAlert").addClass("alert-warning");
        $("#userPassword").focus();
        return false;
    }
    
    var formData = $("#signupForm").serialize();
	
	$("#signupFormAlert").addClass("hidden-xs-up");
    
    $.ajax({
        method: "post",
        url: "ajax/create-user",
        dataType: JSON,
        data: formData,
        success: function(response) {
            if (response) {
                var obj = JSON.parse(response);
                /* blah blah blah */
            }
        }
    
    });
    
    
}

function validateEmail(email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){  
        return (true)  
    } else {
        return false;
    }
}