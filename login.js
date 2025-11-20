import {
    auth,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "./config.js";

// import { checkUser } from "./index.js"

window.login = (event) => {
    event.preventDefault();
    var loginEmail = document.getElementById("loginEmail");
    var loginPassword = document.getElementById("loginPassword");

    signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            console.log("login successfull", user)
            // ...
            window.location.href = "./dashbord.html";
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log("error aagaya ha login me " + errorMessage)
        });
}

function checkUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            console.log("logged in user:", user)
            // window.location.href = "./dashbord.html";
            setTimeout(() => {
                window.location.href = "./dashbord.html"
            }, 8000);
            // ...
        } else {
            // User is signed out
            // ...
        }
    });

};
checkUser();

export{checkUser};
