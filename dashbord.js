import { auth, onAuthStateChanged, signOut } from "./config.js";


window.logout = () => {
    signOut(auth).then(() => {
        window.location.href = "./login.html"
        // Sign-out successful.
    }).catch((error) => {
        // An error happened.
    });
}



function checkUser() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, see docs for a list of available properties
            // https://firebase.google.com/docs/reference/js/auth.user
            const uid = user.uid;
            // ...
        } else {
            // User is signed out
            window.location.href = "./login.html";
            // ...
        }
    });

};
checkUser();