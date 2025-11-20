import {
    setDoc,
    auth,
    doc,
    createUserWithEmailAndPassword,
    db,
    onAuthStateChanged
} from "./config.js";
import { checkUser } from "./login.js";

var firstName = document.getElementById("firstName");
var lastName = document.getElementById("lastName");
var email = document.getElementById("email");
var password = document.getElementById("password");
var phoneNumber = document.getElementById("phoneNumber");
var birthday = document.getElementById("birthday");
var gender = document.getElementById("gender");

window.signupDetails = (event) => {
    event.preventDefault();


    console.log(email.value, password.value)

    createUserWithEmailAndPassword(auth, email.value, password.value)
        .then((userCredential) => {
            // Signed up 
            const user = userCredential.user;
            savingUserDetailsToDb(firstName, lastName, email, phoneNumber, birthday, gender, user.uid)
            console.log("User signed up successfully:", user);
            // window.location.href = "./login.html";
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log("error aagaya ha signup me " , errorMessage)
            // ..
        });
}


async function savingUserDetailsToDb(firstName, lastName, email, phoneNumber, birthday, gender, userId) {
    console.log("user details save ho gae database me")
    // Add a new document in collection "users"
    await setDoc(doc(db, "users", userId), {
        firstName: firstName.value,
        lastName: lastName.value,
        email: email.value,
        phoneNumber: phoneNumber.value,
        birthday: birthday.value,
        gender: gender.value,
        userId: userId
    });

}

// function checkUser() {
//     onAuthStateChanged(auth, (user) => {
//         if (user) {
//             // user logged in
//             setTimeout(() => {
//                 window.location.href = "./dashbord.html";
//             }, 1000)
//         }
//     });
// };
checkUser();


